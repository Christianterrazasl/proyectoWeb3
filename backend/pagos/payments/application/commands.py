import time
from datetime import datetime
from types import SimpleNamespace
from payments.domain.models import Transaction, TransactionStatus
from payments.domain.repositories import ITransactionRepository
import hashlib
from ..infrastructure.rabbitmq_publisher import RabbitMQPublisher

try:
    import requests
except ImportError:
    class _RequestsUnavailableError(Exception):
        pass

    def _requests_unavailable(*_args, **_kwargs):
        raise _RequestsUnavailableError("El cliente HTTP requests no está instalado.")

    requests = SimpleNamespace(
        get=_requests_unavailable,
        patch=_requests_unavailable,
        RequestException=_RequestsUnavailableError,
    )

class DTOValidationError(ValueError):
    def __init__(self, errors):
        super().__init__("Error de validación de datos")
        self._errors = errors

    def errors(self):
        return self._errors


class DebtSyncPendingError(ValueError):
    def __init__(self, transaction):
        super().__init__("El pago fue aprobado, pero la deuda no pudo sincronizarse. Reintente la confirmación.")
        self.transaction = transaction
        self.error_code = "DEBT_SYNC_PENDING"
        self.retryable = True


def _required_string(value, field_name):
    normalized = str(value or "").strip()
    if not normalized:
        return {
            "loc": (field_name,),
            "msg": "Field required",
            "type": "missing",
        }
    return normalized


def _required_positive_int(value, field_name):
    try:
        normalized = int(value)
    except (TypeError, ValueError):
        return {
            "loc": (field_name,),
            "msg": "Input should be a valid integer",
            "type": "int_parsing",
        }

    if normalized <= 0:
        return {
            "loc": (field_name,),
            "msg": "Input should be greater than 0",
            "type": "greater_than",
        }
    return normalized


def _required_positive_amount(value, field_name):
    try:
        normalized = float(value)
    except (TypeError, ValueError):
        return {
            "loc": (field_name,),
            "msg": "Input should be a valid number",
            "type": "float_parsing",
        }

    if normalized <= 0:
        return {
            "loc": (field_name,),
            "msg": "Input should be greater than 0",
            "type": "greater_than",
        }
    return normalized


class CreateTransactionDTO:
    """Input contract for QR creation.

    `debt_id` is mandatory because `tenant/service/customer` alone can describe
    multiple debts over time. Slice 1 closes that ambiguity before persistence.
    """

    def __init__(self, debt_id=None, tenant_id=None, service_id=None, customer_ref=None, amount=None):
        errors = []

        self.debt_id = _required_positive_int(debt_id, "debt_id")
        self.tenant_id = _required_string(tenant_id, "tenant_id")
        self.service_id = _required_string(service_id, "service_id")
        self.customer_ref = _required_string(customer_ref, "customer_ref")
        self.amount = _required_positive_amount(amount, "amount")

        for value in [self.debt_id, self.tenant_id, self.service_id, self.customer_ref, self.amount]:
            if isinstance(value, dict):
                errors.append(value)

        if errors:
            raise DTOValidationError(errors)


class CreateTransactionCommandHandler:
    def __init__(self, transaction_repository: ITransactionRepository):
        self.transaction_repository = transaction_repository

    def execute(self, dto: CreateTransactionDTO) -> Transaction:
        try:
            # `deudas` is the authoritative source for debt existence/state. We
            # call its public GET /debts contract with the full exact identity so
            # `pagos` never creates a transaction against the wrong obligation.
            deudas_url = (
                f"http://deudas:3000/debts?id={dto.debt_id}&tenant_id={dto.tenant_id}"
                f"&service_id={dto.service_id}&customer_ref={dto.customer_ref}&status=PENDING"
            )
            response = requests.get(deudas_url, timeout=5)

            if response.status_code == 404:
                raise ValueError("La deuda exacta no existe o ya no está pendiente.")

            if response.status_code != 200:
                raise ValueError("No se pudo validar la deuda exacta en este momento.")

            debt_matches = response.json()
            # The exact contract is "one pending debt". Zero means missing or no
            # longer payable; more than one means the identity check degraded.
            if not isinstance(debt_matches, list) or len(debt_matches) != 1:
                raise ValueError("La deuda exacta no existe o ya no está pendiente.")

            deuda_data = debt_matches[0]

            if int(deuda_data.get("id", 0)) != dto.debt_id:
                raise ValueError("La deuda exacta no existe o ya no está pendiente.")

            if (
                str(deuda_data.get("tenant_id")) != dto.tenant_id
                or str(deuda_data.get("service_id")) != dto.service_id
                or str(deuda_data.get("customer_ref")) != dto.customer_ref
                or str(deuda_data.get("status")) != TransactionStatus.PENDING.value
            ):
                raise ValueError("La deuda exacta no existe o ya no está pendiente.")

            if float(deuda_data.get("amount", 0)) != dto.amount:
                raise ValueError(f"Monto incorrecto. La deuda real es de {deuda_data.get('amount')}")
        except requests.RequestException:
            raise ValueError("El servicio de deudas no está disponible temporalmente.")

        transaction_id = f"txn-{int(time.time() * 1000)}"
        new_transaction = Transaction(
            id=transaction_id,
            debt_id=dto.debt_id,
            tenant_id=dto.tenant_id,
            service_id=dto.service_id,
            customer_ref=dto.customer_ref,
            amount=dto.amount,
            status=TransactionStatus.PENDING,
            created_at=datetime.now(),
            receipt_hash=None
        )

        self.transaction_repository.save(new_transaction)
        return new_transaction

class ConfirmPaymentDTO:
    def __init__(self, transaction_id=None, action="APPROVE"):
        errors = []

        self.transaction_id = _required_string(transaction_id, "transaction_id")
        self.action = _required_string(action, "action")

        for value in [self.transaction_id, self.action]:
            if isinstance(value, dict):
                errors.append(value)

        if errors:
            raise DTOValidationError(errors)


class ConfirmPaymentCommandHandler:
    """
    Caso de Uso: Confirmar un pago exitoso.
    Cambia el estado, genera un recibo y avisa al resto del sistema vía RabbitMQ.
    """

    def __init__(self, transaction_repository: ITransactionRepository, event_publisher: RabbitMQPublisher):
        self.transaction_repository = transaction_repository
        self.event_publisher = event_publisher

    def execute(self, dto: ConfirmPaymentDTO) -> Transaction:
        transaction = self.transaction_repository.find_by_id(dto.transaction_id)
        if not transaction:
            raise ValueError("La transacción solicitada no existe.")

        if transaction.is_successful() and dto.action == "APPROVE":
            return transaction

        if transaction.status == TransactionStatus.FAILED and dto.action == "REJECT":
            return transaction


        if dto.action == "REJECT":
            transaction.mark_as_failed()
            self.transaction_repository.save(transaction)
            return transaction


        raw_string = f"{transaction.id}-{transaction.amount}-{time.time()}"
        receipt_hash = hashlib.sha256(raw_string.encode()).hexdigest()[:15].upper()

        try:
            sync_response = requests.patch(
                f"http://deudas:3000/admin/debts/{transaction.debt_id}/status",
                json={"status": "PAID"},
                timeout=5,
            )
        except requests.RequestException as error:
            raise DebtSyncPendingError(transaction) from error

        if sync_response.status_code < 200 or sync_response.status_code >= 300:
            raise DebtSyncPendingError(transaction)

        # Si el cobro fue aprobado pero `deudas` no confirma `PAID`, NO debemos
        # fabricar un `SUCCESS`: mantener `PENDING` permite reintentar sin mentir.
        transaction.mark_as_success(f"RCPT-{receipt_hash}")
        self.transaction_repository.save(transaction)

        # RabbitMQ solo puede salir después del sync exitoso para no propagar un
        # evento `Payment.Completed` que el resto del sistema todavía no puede sostener.
        self.event_publisher.publish_payment_completed(transaction)

        return transaction
