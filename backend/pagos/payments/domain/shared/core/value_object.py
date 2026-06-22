from abc import ABC

class ValueObject(ABC):
    def __eq__(self, other):
        if not isinstance(other, type(self)):
            return False
        return vars(self) == vars(other)

    def __hash__(self):
        return hash(tuple(sorted(vars(self).items())))