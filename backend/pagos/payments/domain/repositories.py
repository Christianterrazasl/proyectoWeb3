from abc import ABC, abstractmethod
from .models import Transaction


class TransactionRepository(ABC):

    @abstractmethod
    def find_by_id(self, transaction_id: str) -> Transaction:
        pass

    @abstractmethod
    def save(self, transaction: Transaction):
        pass