import hashlib
import time
import requests
from .shared.core.command_handler import CommandHandler
from ..domain.models import Transaction, TransactionStatus


class CreateTransactionCommandHandler(CommandHandler):
    def __init__(self, transaction_repository):
        self.transaction_repository = transaction_repository

    def execute(self, data: dict) -> Transaction:
        tenant_id = data.get('tenant_id')
        service_id = data.get('service_id')
        customer_ref = data.get('customer_ref')

        try:
            amount = float(data.get('amount', 0))
        except (ValueError, TypeError):
            raise ValueError("El monto proporcionado no es un número válido.")

        try:
            deudas_url = f"http://deudas:3000/debts/lookup?tenantId={tenant_id}&serviceId={service_id}&customerRef={customer_ref}"
            response = requests.get(deudas_url, timeout=5)

            if response.status_code == 404:
                raise ValueError("La deunda no existe en los registros de la empresa.")

            deuda_data = response.json().get("data", {})
            if float(deuda_data.get("amount", 0)) != amount:
                raise ValueError(f"Monto incorrecto. La deuda real es de {deuda_data.get('amount')} Bs.")
        except requests.RequestException:
            raise ValueError("El servicio de deudas no está disponible temporalmente.")

        transaction = Transaction.create(
            tenant_id=tenant_id,
            service_id=service_id,
            customer_ref=customer_ref,
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

        if action == "REJECT":
            transaction.mark_as_failed()
        else:
            raw_string = f"{transaction.id}-{transaction.amount}-{time.time()}"
            receipt_hash = f"RCPT-{hashlib.sha256(raw_string.encode()).hexdigest()[:15].upper()}"
            transaction.mark_as_successful(receipt_hash)

            try:
                update_payload = {
                    "tenantId": transaction.tenant_id,
                    "serviceId": transaction.service_id,
                    "customerRef": transaction.customer_ref,
                    "status": "PAID"
                }
                requests.patch("http://deudas:3000/debts/update-status", json=update_payload, timeout=5)
            except Exception as e:
                print(f"[Warning] No se pudo notificar la liquidación al MS de Deudas: {e}")

            self.event_publisher.publish_payment_completed(transaction)

        self.transaction_repository.save(transaction)
        return transaction