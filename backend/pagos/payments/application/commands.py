import hashlib
import os
import time
import requests
from .shared.core.command_handler import CommandHandler
from ..domain.models import Transaction, TransactionStatus


DEBTS_SERVICE_URL = os.getenv('DEBTS_SERVICE_URL', 'http://deudas:3000')


class DebtSyncPendingError(ValueError):
    pass


def _load_exact_debt(data: dict) -> dict:
    debt_id = data.get('debt_id')

    try:
        debt_id = int(debt_id)
    except (TypeError, ValueError):
        raise ValueError('El debt_id obligatorio debe ser un entero positivo.')

    if debt_id <= 0:
        raise ValueError('El debt_id obligatorio debe ser un entero positivo.')

    tenant_id = data.get('tenant_id')
    service_id = data.get('service_id')
    customer_ref = data.get('customer_ref')

    try:
        response = requests.get(
            f'{DEBTS_SERVICE_URL}/debts',
            params={
                'id': debt_id,
                'tenant_id': tenant_id,
                'service_id': service_id,
                'customer_ref': customer_ref,
                'status': 'PENDING',
            },
            timeout=5,
        )
    except requests.RequestException:
        raise ValueError('El servicio de deudas no está disponible temporalmente.')

    if not response.ok:
        raise ValueError('La deuda exacta no existe o no está pendiente.')

    body = response.json()
    debts = body.get('data') if isinstance(body, dict) else body

    if not isinstance(debts, list) or len(debts) != 1:
        raise ValueError('La deuda exacta no existe o no está pendiente.')

    debt = debts[0]
    if float(debt.get('amount', 0)) != float(data.get('amount', 0)):
        raise ValueError(f"Monto incorrecto. La deuda real es de {debt.get('amount')} Bs.")

    return debt


def _mark_debt_as_paid(transaction: Transaction) -> None:
    try:
        response = requests.patch(
            f'{DEBTS_SERVICE_URL}/internal/debts/{transaction.debt_id}/status',
            json={'status': 'PAID'},
            timeout=5,
        )
    except requests.RequestException as error:
        raise DebtSyncPendingError(
            f'No se pudo sincronizar la deuda exacta. Reintente la confirmación. Detalle: {error}'
        )

    if not response.ok:
        raise DebtSyncPendingError('No se pudo sincronizar la deuda exacta.')

    try:
        body = response.json()
    except ValueError:
        body = None

    if isinstance(body, dict) and body.get('success') is False:
        raise DebtSyncPendingError('No se pudo sincronizar la deuda exacta.')


class CreateTransactionCommandHandler(CommandHandler):
    def __init__(self, transaction_repository):
        self.transaction_repository = transaction_repository

    def execute(self, data: dict) -> Transaction:
        try:
            amount = float(data.get('amount', 0))
        except (ValueError, TypeError):
            raise ValueError("El monto proporcionado no es un número válido.")

        debt = _load_exact_debt(data)

        transaction = Transaction.create(
            debt_id=int(debt.get('id')),
            tenant_id=data.get('tenant_id'),
            service_id=data.get('service_id'),
            customer_ref=data.get('customer_ref'),
            amount=amount
        )

        self.transaction_repository.save(transaction)
        return transaction


class ConfirmPaymentCommandHandler(CommandHandler):
    def __init__(self, transaction_repository, event_publisher):
        self.transaction_repository = transaction_repository
        self.event_publisher = event_publisher

    def execute(self, data: dict) -> Transaction:
        transaction_id = data.get('transaction_id')
        action = data.get('action', 'APPROVE')

        transaction = self.transaction_repository.find_by_id(transaction_id)
        if not transaction:
            raise ValueError("La transacción solicitada no existe.")

        # Repetir la misma acción terminal no debe duplicar efectos secundarios ni cambiar historial.
        if action == 'APPROVE' and transaction.status == TransactionStatus.SUCCESS:
            return transaction

        if action == 'REJECT' and transaction.status == TransactionStatus.FAILED:
            return transaction

        if action == "REJECT":
            transaction.mark_as_failed()
            self.transaction_repository.save(transaction)
            return transaction

        _mark_debt_as_paid(transaction)

        raw_string = f"{transaction.id}-{transaction.amount}-{time.time()}"
        receipt_hash = f"RCPT-{hashlib.sha256(raw_string.encode()).hexdigest()[:15].upper()}"
        transaction.mark_as_successful(receipt_hash)
        self.transaction_repository.save(transaction)

        # Publicamos recién después del sync exacto para evitar falsos positivos en consumidores.
        self.event_publisher.publish_payment_completed(transaction)

        return transaction
