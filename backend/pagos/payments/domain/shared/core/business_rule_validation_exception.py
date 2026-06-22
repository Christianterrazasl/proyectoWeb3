from .business_rule import BusinessRule


class BusinessRuleValidationException(Exception):
    def __init__(self, rule: BusinessRule):
        self.rule = rule
        super().__init__(self.rule.message())

    def __str__(self):
        return f"BusinessRuleValidationException: {self.rule.message()}"