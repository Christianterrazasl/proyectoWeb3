from ..core.business_rule import BusinessRule

class PositiveAmountRule(BusinessRule):
    def __init__(self, amount: float):
        self.amount = amount

    def is_valid(self) -> bool:
        try:
            return self.amount is not None and float(self.amount) > 0
        except ValueError:
            return False

    def message(self) -> str:
        return "El monto de la transacción debe ser mayor a cero."