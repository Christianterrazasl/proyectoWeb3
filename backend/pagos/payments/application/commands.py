import time
from datetime import datetime
from pydantic import BaseModel, Field
from payments.domain.models import Transaction, TransactionStatus
from payments.domain.repositories import ITransactionRepository
import requests
import hashlib
from ..infrastructure.rabbitmq_publisher import RabbitMQPublisher

class CreateTransactionDTO(BaseModel):
    tenant_id: str = Field(..., min_length=1)
    service_id: str = Field(..., min_length=1)
    customer_ref: str = Field(..., min_length=1)
    amount: float = Field(..., gt=0)  # El monto debe ser mayor a 0


class CreateTransactionCommandHandler:
    def __init__(self, transaction_repository: ITransactionRepository):
        self.transaction_repository = transaction_repository

    def execute(self, dto: CreateTransactionDTO) -> Transaction:
        try:
            deudas_url = f"http://deudas:3000/debts/lookup?tenantId={dto.tenant_id}&serviceId={dto.service_id}&customerRef={dto.customer_ref}"
            response = requests.get(deudas_url, timeout=5)

            if response.status_code == 404:
                raise ValueError("La deuda no existe en los registros de la empresa.")

            deuda_data = response.json().get("data", {})

            if float(deuda_data.get("amount", 0)) != dto.amount:
                raise ValueError(f"Monto incorrecto. La deuda real es de {deuda_data.get('amount')}")
        except requests.RequestException:
            raise ValueError("El servicio de deudas no está disponible temporalmente.")

        transaction_id = f"txn-{int(time.time() * 1000)}"
        new_transaction = Transaction(
            id=transaction_id,
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

class ConfirmPaymentDTO(BaseModel):
    transaction_id: str = Field(..., min_length=1)


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
        if not transaction: raise ValueError("La transacción solicitada no existe.")
        if transaction.is_successful(): raise ValueError("Esta transacción ya fue pagada.")


        if dto.action == "REJECT":
            transaction.status = TransactionStatus.FAILED
            self.transaction_repository.save(transaction)
            return transaction


        raw_string = f"{transaction.id}-{transaction.amount}-{time.time()}"
        receipt_hash = hashlib.sha256(raw_string.encode()).hexdigest()[:15].upper()

        transaction.status = TransactionStatus.SUCCESS
        transaction.receipt_hash = f"RCPT-{receipt_hash}"
        self.transaction_repository.save(transaction)

        try:
            update_payload = {
                "tenantId": transaction.tenant_id,
                "serviceId": transaction.service_id,
                "customerRef": transaction.customer_ref,
                "status": "PAID"
            }
            requests.patch("http://deudas:3000/debts/update-status", json=update_payload)
        except Exception as e:
            print(f"Error actualizando MS Deudas: {e}")

        # Mantenemos RabbitMQ para analíticas/reportes
        self.event_publisher.publish_payment_completed(transaction)

        return transaction

class ConfirmPaymentDTO(BaseModel):
    transaction_id: str = Field(..., min_length=1)
    action: str = Field(default="APPROVE")