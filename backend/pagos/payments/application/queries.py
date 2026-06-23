from datetime import datetime

from .shared.core.query_handler import QueryHandler
from ..infrastructure.mongo_client import transactions_collection


ADMIN_ROLES = {'admin'}
LIST_RESPONSE_FIELDS = (
    'id',
    'debt_id',
    'tenant_id',
    'service_id',
    'status',
    'amount',
    'customer_ref',
    'created_at',
    'receipt_hash',
)


def _normalize_string(value):
    if value is None:
        return None

    text = str(value).strip()
    return text or None


def _parse_iso_datetime(value):
    normalized = _normalize_string(value)

    if normalized is None:
        return None

    if normalized.endswith('Z'):
        normalized = normalized[:-1] + '+00:00'

    return normalized


def _normalize_created_at(value):
    if isinstance(value, datetime):
        return value.isoformat()

    return _normalize_string(value)


def _normalize_transaction(transaction: dict) -> dict:
    normalized = {
        field: transaction.get(field)
        for field in LIST_RESPONSE_FIELDS
    }
    normalized['created_at'] = _normalize_created_at(transaction.get('created_at'))
    return normalized


def _resolve_tenant_filter(filters: dict, scope: dict | None) -> str | None:
    requested_tenant_id = _normalize_string(filters.get('tenant_id'))

    if not scope:
        return requested_tenant_id

    scoped_tenant_id = _normalize_string(scope.get('tenant_id'))
    global_role = _normalize_string(scope.get('global_role'))

    if scoped_tenant_id is None:
        return requested_tenant_id

    if global_role not in ADMIN_ROLES:
        return scoped_tenant_id

    return requested_tenant_id or scoped_tenant_id


class ListTransactionsQueryHandler(QueryHandler):
    def execute(self, filters: dict | None = None, scope: dict | None = None) -> list[dict]:
        filters = filters or {}
        tenant_id = _resolve_tenant_filter(filters, scope)
        service_id = _normalize_string(filters.get('service_id'))
        status = _normalize_string(filters.get('status'))
        customer_ref = _normalize_string(filters.get('customer_ref'))
        from_value = _parse_iso_datetime(filters.get('from'))
        to_value = _parse_iso_datetime(filters.get('to'))

        # Hoy cargamos y filtramos en memoria porque el adapter actual de Mongo ya
        # expone documentos heterogéneos; primero normalizamos shape/fechas y luego
        # aplicamos reglas de alcance consistentes para admin y reportes.
        transactions = [
            _normalize_transaction(transaction)
            for transaction in transactions_collection.find({}, {'_id': 0})
        ]

        def matches(transaction):
            if tenant_id is not None and str(transaction.get('tenant_id')) != tenant_id:
                return False

            if service_id is not None and str(transaction.get('service_id')) != service_id:
                return False

            if status is not None and str(transaction.get('status')).upper() != status.upper():
                return False

            if customer_ref is not None and str(transaction.get('customer_ref')) != customer_ref:
                return False

            created_at = _normalize_string(transaction.get('created_at'))

            if from_value is not None and (created_at is None or created_at < from_value):
                return False

            if to_value is not None and (created_at is None or created_at > to_value):
                return False

            return True

        filtered_transactions = [
            transaction for transaction in transactions if matches(transaction)
        ]

        filtered_transactions.sort(
            key=lambda transaction: _normalize_string(transaction.get('created_at')) or '',
            reverse=True,
        )

        return filtered_transactions

class GetTransactionQueryHandler(QueryHandler):
    def execute(self, transaction_id: str) -> dict:
        transaction = transactions_collection.find_one(
            {'id': transaction_id},
            {'_id': 0}
        )
        return transaction
