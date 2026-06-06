from datetime import datetime
import re
from typing import Optional, List, Dict, Any
from ..domain.models import Transaction, TransactionStatus
from ..domain.repositories import ITransactionRepository
from .django_models import TransactionModel
from .mongo_client import transactions_collection


class TransactionRepositoryImpl(ITransactionRepository):

    def save(self, transaction: Transaction) -> None:
        # 1. Guardar en PostgreSQL (Fuente de la Verdad Transaccional)
        # Usamos update_or_create para manejar tanto inserciones nuevas como actualizaciones
        TransactionModel.objects.update_or_create(
            id=transaction.id,
            defaults={
                'tenant_id': transaction.tenant_id,
                'service_id': transaction.service_id,
                'customer_ref': transaction.customer_ref,
                'amount': transaction.amount,
                'status': transaction.status.value,  # Extraemos el string del Enum
                'created_at': transaction.created_at,
                'receipt_hash': transaction.receipt_hash,
            }
        )

        # 2. Sincronizar con MongoDB (Proyección aplanada para lecturas rápidas)
        transactions_collection.update_one(
            {'id': transaction.id},
            {'$set': {
                'id': transaction.id,
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
        # Las consultas internas de validación las hacemos contra Postgres
        try:
            model = TransactionModel.objects.get(id=transaction_id)
            return Transaction(
                id=model.id,
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

    def list_admin_transactions(
        self,
        tenant_id: Optional[str] = None,
        service_id: Optional[str] = None,
        status: Optional[str] = None,
        customer_ref: Optional[str] = None,
        created_from: Optional[datetime] = None,
        created_to: Optional[datetime] = None,
    ) -> List[Dict[str, Any]]:
        # Esta consulta sale desde Mongo porque la vista admin prioriza lectura simple.
        # La escritura y consistencia transaccional siguen respaldadas por Postgres en `pagos`.
        query: Dict[str, Any] = {}

        if tenant_id:
            # `tenant_id` llega desde el scope admin ya resuelto aguas arriba.
            query['tenant_id'] = tenant_id

        if service_id:
            query['service_id'] = service_id

        if status:
            query['status'] = status.upper()

        if customer_ref:
            query['customer_ref'] = {
                '$regex': re.escape(customer_ref),
                '$options': 'i'
            }

        created_at_filter: Dict[str, datetime] = {}
        if created_from:
            created_at_filter['$gte'] = created_from
        if created_to:
            created_at_filter['$lte'] = created_to
        if created_at_filter:
            query['created_at'] = created_at_filter

        projection = {
            '_id': 0,
            'id': 1,
            'created_at': 1,
            'status': 1,
            'amount': 1,
            'tenant_id': 1,
            'service_id': 1,
            'customer_ref': 1,
            'receipt_hash': 1,
        }

        documents = transactions_collection.find(query, projection).sort('created_at', -1)
        return [self._serialize_admin_transaction(document) for document in documents]

    def _serialize_admin_transaction(self, document: Dict[str, Any]) -> Dict[str, Any]:
        # Serializamos un shape estable para que `reportes` pueda enriquecer nombres sin reinterpretar Mongo.
        created_at = document.get('created_at')

        if isinstance(created_at, datetime):
            created_at = created_at.isoformat()

        return {
            'transaction_id': document.get('id'),
            'created_at': created_at,
            'status': document.get('status'),
            'amount': float(document.get('amount', 0)),
            'tenant_id': document.get('tenant_id'),
            'service_id': document.get('service_id'),
            'customer_ref': document.get('customer_ref'),
            'receipt_hash': document.get('receipt_hash'),
        }
