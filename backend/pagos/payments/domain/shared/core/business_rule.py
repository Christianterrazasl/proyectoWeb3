from abc import ABC, abstractmethod

class BusinessRule(ABC):
    @abstractmethod
    def is_valid(self) -> bool:
        pass

    @abstractmethod
    def message(self) -> str:
        pass