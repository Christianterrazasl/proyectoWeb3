from typing import Optional, List
from ..domain.models import Transaction, TransactionStatus
from ..domain.repositories import ITransactionRepository
from .django_models import TransactionModel
from .mongo_client import transactions_collection


class TransactionRepositoryImpl(ITransactionRepository):

    def save(self, transaction: Transaction) -> None:
        # PostgreSQL keeps the transactional truth used by commands such as
        # confirmation; this is the canonical persisted version of the payment.
        TransactionModel.objects.update_or_create(
            id=transaction.id,
            defaults={
                'debt_id': transaction.debt_id,
                'tenant_id': transaction.tenant_id,
                'service_id': transaction.service_id,
                'customer_ref': transaction.customer_ref,
                'amount': transaction.amount,
                'status': transaction.status.value,  # Extraemos el string del Enum
                'created_at': transaction.created_at,
                'receipt_hash': transaction.receipt_hash,
            }
        )

        # Mongo receives a denormalized projection for fast reads/reporting. The
        # same `debt_id` must travel here so future read-side features can trace
        # the payment back to the exact debt without rebuilding identity.
        transactions_collection.update_one(
            {'id': transaction.id},
            {'$set': {
                'id': transaction.id,
                'debt_id': transaction.debt_id,
                'tenant_id': transaction.tenant_id,
                'service_id': transaction.service_id,
                'customer_ref': transaction.customer_ref,
                'amount': float(transaction.amount),  # Mongo prefiere float estándar
                'status': transaction.status.value,
                'created_at': transaction.created_at,
                'receipt_hash': transaction.receipt_hash,
            }},
            upsert=True  # Si no existe, lo crea
        )

    def find_by_id(self, transaction_id: str) -> Optional[Transaction]:
        # Commands read from Postgres because it is the write-side source of truth.
        try:
            model = TransactionModel.objects.get(id=transaction_id)
            return Transaction(
                id=model.id,
                debt_id=model.debt_id,
                tenant_id=model.tenant_id,
                service_id=model.service_id,
                customer_ref=model.customer_ref,
                amount=float(model.amount),
                status=TransactionStatus(model.status),
                created_at=model.created_at,
                receipt_hash=model.receipt_hash
            )
        except TransactionModel.DoesNotExist:
            return None

    def find_by_tenant_and_service(self, tenant_id: str, service_id: str) -> List[Transaction]:
        # Lo dejaremos preparado por si lo necesitamos después
        pass
