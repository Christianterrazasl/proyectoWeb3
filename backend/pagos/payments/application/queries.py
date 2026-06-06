from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from ..domain.repositories import ITransactionRepository
from ..infrastructure.mongo_client import transactions_collection


@dataclass
class AdminTransactionFilters:
    """Filtros administrativos reutilizables entre la API de pagos y el monitoreo de reportes."""
    tenant_id: Optional[str] = None
    service_id: Optional[str] = None
    status: Optional[str] = None
    customer_ref: Optional[str] = None
    created_from: Optional[datetime] = None
    created_to: Optional[datetime] = None

class GetTransactionQueryHandler:
    """
    Query de CQRS: Obtener el estado de una transacción.
    Va directo a la vista proyectada en MongoDB, saltándose Postgres y el Dominio.
    """
    def execute(self, transaction_id: str) -> dict:
        # Buscamos en Mongo y excluimos el campo interno '_id' que genera Mongo por defecto
        # para que no rompa la serialización del JSON en Django.
        transaction = transactions_collection.find_one(
            {'id': transaction_id},
            {'_id': 0}
        )
        return transaction


class ListAdminTransactionsQueryHandler:
    """
    Query para la consola admin.
    Lee la proyección en Mongo porque monitoreo necesita filtros rápidos
    sin mover la propiedad del dato fuera de `pagos`.
    """

    def __init__(self, transaction_repository: ITransactionRepository):
        self.transaction_repository = transaction_repository

    def execute(self, filters: AdminTransactionFilters) -> list[dict]:
        # El caso de uso no interpreta permisos; solo aplica el scope/filtros ya resueltos por la API.
        return self.transaction_repository.list_admin_transactions(
            tenant_id=filters.tenant_id,
            service_id=filters.service_id,
            status=filters.status,
            customer_ref=filters.customer_ref,
            created_from=filters.created_from,
            created_to=filters.created_to,
        )
