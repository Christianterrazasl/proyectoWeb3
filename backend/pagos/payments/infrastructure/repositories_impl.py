from datetime import datetime
from ..domain.models import Transaction, TransactionStatus
from .django_models import TransactionORM
from .mongo_client import transactions_collection


class TransactionRepositoryImpl:

    def find_by_id(self, transaction_id: str) -> Transaction:
        try:
            orm_model = TransactionORM.objects.get(id=transaction_id)
            return Transaction(
                entity_id=orm_model.id,
                tenant_id=orm_model.tenant_id,
                service_id=orm_model.service_id,
                customer_ref=orm_model.customer_ref,
                amount=float(orm_model.amount),
                status=TransactionStatus(orm_model.status),
                created_at=orm_model.created_at,
                receipt_hash=orm_model.receipt_hash
            )
        except TransactionORM.DoesNotExist:
            return None

    def save(self, transaction: Transaction):
        TransactionORM.objects.update_or_create(
            id=transaction.id,
            defaults={
                'tenant_id': transaction.tenant_id,
                'service_id': transaction.service_id,
                'customer_ref': transaction.customer_ref,
                'amount': transaction.amount,
                'status': transaction.status.value,
                'receipt_hash': transaction.receipt_hash,
                'created_at': transaction.created_at
            }
        )

        transactions_collection.update_one(
            {'id': transaction.id},
            {'$set': {
                'id': transaction.id,
                'tenant_id': transaction.tenant_id,
                'service_id': transaction.service_id,
                'customer_ref': transaction.customer_ref,
                'amount': transaction.amount,
                'status': transaction.status.value,
                'receipt_hash': transaction.receipt_hash,
                'created_at': transaction.created_at.isoformat() if isinstance(transaction.created_at,
                                                                               datetime) else transaction.created_at
            }},
            upsert=True
        )