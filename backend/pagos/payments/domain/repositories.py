from abc import ABC, abstractmethod
from typing import Optional, List
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