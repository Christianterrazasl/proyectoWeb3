from abc import ABC, abstractmethod

class QueryHandler(ABC):
    @abstractmethod
    def execute(self, query_or_data):
        pass