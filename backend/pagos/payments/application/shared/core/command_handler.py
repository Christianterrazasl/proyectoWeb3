from abc import ABC, abstractmethod

class CommandHandler(ABC):
    @abstractmethod
    def execute(self, command_or_data):
        pass