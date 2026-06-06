from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional, List, Dict, Any
from .models import Transaction


class ITransactionRepository(ABC):
    """
    Contrato del Repositorio de Transacciones.
    La capa de Casos de Uso (Application) utilizará esta abstracción,
    ignorando si por debajo se usa el ORM de Django o MongoDB.
    """

    @abstractmethod
    def save(self, transaction: Transaction) -> None:
        pass

    @abstractmethod
    def find_by_id(self, transaction_id: str) -> Optional[Transaction]:
        pass

    @abstractmethod
    def find_by_tenant_and_service(self, tenant_id: str, service_id: str) -> List[Transaction]:
        pass

    @abstractmethod
    def list_admin_transactions(
        self,
        tenant_id: Optional[str] = None,
        service_id: Optional[str] = None,
        status: Optional[str] = None,
        customer_ref: Optional[str] = None,
        created_from: Optional[datetime] = None,
        created_to: Optional[datetime] = None,
    ) -> List[Dict[str, Any]]:
        pass
