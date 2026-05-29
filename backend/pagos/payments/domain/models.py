from datetime import datetime
from enum import Enum
from typing import Optional


class TransactionStatus(Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class Transaction:
    """
    Entidad de Dominio: Transacción
    Representa un intento de pago mediante QR.
    Esta clase es Python puro y no sabe nada de Django ni de bases de datos.
    """

    def __init__(
            self,
            id: str,  # ej: txn-12345
            tenant_id: str,  # El ID de la empresa a la que se le paga
            service_id: str,  # El ID del servicio (ej: srv-001)
            customer_ref: str,  # El identificador del cliente (ej: Nro Suministro)
            amount: float,
            status: TransactionStatus,
            created_at: datetime,
            receipt_hash: Optional[str] = None  # Hash de comprobante, nulo al inicio
    ):
        self.id = id
        self.tenant_id = tenant_id
        self.service_id = service_id
        self.customer_ref = customer_ref
        self.amount = amount
        self.status = status
        self.created_at = created_at
        self.receipt_hash = receipt_hash

    # === Reglas de Negocio ===

    def is_successful(self) -> bool:
        return self.status == TransactionStatus.SUCCESS

    def mark_as_success(self, receipt_hash: str) -> None:
        """Marca el pago como exitoso y asigna el hash del recibo."""
        self.status = TransactionStatus.SUCCESS
        self.receipt_hash = receipt_hash

    def mark_as_failed(self) -> None:
        """Marca el pago como fallido."""
        self.status = TransactionStatus.FAILED