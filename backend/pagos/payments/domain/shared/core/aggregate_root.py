from .entity import Entity
from .business_rule import BusinessRule
from .business_rule_validation_exception import BusinessRuleValidationException

class AggregateRoot(Entity):
    def __init__(self, entity_id):
        super().__init__(entity_id)

    @staticmethod
    def check_rule(rule: BusinessRule):
        if not rule.is_valid():
            raise BusinessRuleValidationException(rule)