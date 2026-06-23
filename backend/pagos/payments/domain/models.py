import time
from enum import Enum
from datetime import datetime
from .shared.core.aggregate_root import AggregateRoot
from .shared.rules.string_not_null_or_empty_rule import StringNotNullOrEmptyRule
from .shared.rules.positive_amount_rule import PositiveAmountRule


class TransactionStatus(str, Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class Transaction(AggregateRoot):
    def __init__(self, entity_id: str, debt_id: int, tenant_id: str, service_id: str, customer_ref: str,
                 amount: float, status: TransactionStatus, created_at: datetime, receipt_hash: str = None):
        super().__init__(entity_id)
        self.debt_id = debt_id
        self.tenant_id = tenant_id
        self.service_id = service_id
        self.customer_ref = customer_ref
        self.amount = amount
        self.status = status
        self.created_at = created_at
        self.receipt_hash = receipt_hash

    @staticmethod
    def create(debt_id: int, tenant_id: str, service_id: str, customer_ref: str, amount: float):
        if not isinstance(debt_id, int) or debt_id <= 0:
            raise ValueError("El debt_id obligatorio debe ser un entero positivo.")

        AggregateRoot.check_rule(StringNotNullOrEmptyRule(tenant_id, "tenant_id"))
        AggregateRoot.check_rule(StringNotNullOrEmptyRule(service_id, "service_id"))
        AggregateRoot.check_rule(StringNotNullOrEmptyRule(customer_ref, "customer_ref"))
        AggregateRoot.check_rule(PositiveAmountRule(amount))

        entity_id = f"txn-{int(time.time() * 1000)}"
        return Transaction(
            entity_id=entity_id,
            debt_id=debt_id,
            tenant_id=tenant_id,
            service_id=service_id,
            customer_ref=customer_ref,
            amount=amount,
            status=TransactionStatus.PENDING,
            created_at=datetime.now(),
            receipt_hash=None
        )

    def is_successful(self) -> bool:
        return self.status == TransactionStatus.SUCCESS

    def mark_as_failed(self):
        if self.status != TransactionStatus.PENDING:
            raise ValueError("Solo se pueden rechazar transacciones que están pendientes.")
        self.status = TransactionStatus.FAILED

    def mark_as_successful(self, receipt_hash: str):
        if self.status != TransactionStatus.PENDING:
            raise ValueError("Solo se pueden aprobar transacciones que están pendientes.")

        AggregateRoot.check_rule(StringNotNullOrEmptyRule(receipt_hash, "receipt_hash"))

        self.status = TransactionStatus.SUCCESS
        self.receipt_hash = receipt_hash
