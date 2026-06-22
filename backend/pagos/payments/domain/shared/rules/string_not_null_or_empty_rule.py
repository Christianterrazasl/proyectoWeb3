from ..core.business_rule import BusinessRule

class StringNotNullOrEmptyRule(BusinessRule):
    def __init__(self, value: str, field_name: str):
        self.value = value
        self.field_name = field_name

    def is_valid(self) -> bool:
        return self.value is not None and str(self.value).strip() != ""

    def message(self) -> str:
        return f"El campo '{self.field_name}' no puede ser nulo ni estar vacío."