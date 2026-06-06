import time
from django.utils import timezone
from pydantic import BaseModel, Field
from payments.domain.models import Transaction, TransactionStatus
from payments.domain.repositories import ITransactionRepository
import hashlib
from ..infrastructure.rabbitmq_publisher import RabbitMQPublisher

# 1. El DTO (Data Transfer Object) validado con Pydantic
# Si el frontend manda un "amount" en formato texto (ej: "hola"), Pydantic lanzará error automático.
class CreateTransactionDTO(BaseModel):
    tenant_id: str = Field(..., min_length=1)
    service_id: str = Field(..., min_length=1)
    customer_ref: str = Field(..., min_length=1)
    amount: float = Field(..., gt=0)  # El monto debe ser mayor a 0


# 2. El Manejador del Comando (Use Case)
class CreateTransactionCommandHandler:
    """
    Caso de Uso: Iniciar un proceso de pago.
    Recibe los datos del frontend, crea la transacción en estado PENDING
    y la guarda en la base de datos.
    """

    # Inyectamos el repositorio (Inversión de Dependencias)
    def __init__(self, transaction_repository: ITransactionRepository):
        self.transaction_repository = transaction_repository

    def execute(self, dto: CreateTransactionDTO) -> Transaction:
        # Generamos un ID único basado en el timestamp actual
        transaction_id = f"txn-{int(time.time() * 1000)}"

        # Instanciamos nuestra Entidad de Dominio pura
        new_transaction = Transaction(
            id=transaction_id,
            tenant_id=dto.tenant_id,
            service_id=dto.service_id,
            customer_ref=dto.customer_ref,
            amount=dto.amount,
            status=TransactionStatus.PENDING,  # Nace siempre pendiente
            created_at=timezone.now(),
            receipt_hash=None
        )

        # Delegamos la persistencia al repositorio (que escribirá en Postgres y Mongo)
        self.transaction_repository.save(new_transaction)

        return new_transaction

# --- NUEVO CÓDIGO ---

class ConfirmPaymentDTO(BaseModel):
    transaction_id: str = Field(..., min_length=1)


class ConfirmPaymentCommandHandler:
    """
    Caso de Uso: Confirmar un pago exitoso.
    Cambia el estado, genera un recibo y avisa al resto del sistema vía RabbitMQ.
    """

    def __init__(self, transaction_repository: ITransactionRepository, event_publisher: RabbitMQPublisher):
        self.transaction_repository = transaction_repository
        self.event_publisher = event_publisher

    def execute(self, dto: ConfirmPaymentDTO) -> Transaction:
        # 1. Buscamos la transacción en la base de datos
        transaction = self.transaction_repository.find_by_id(dto.transaction_id)

        if not transaction:
            raise ValueError("La transacción solicitada no existe.")

        if transaction.is_successful():
            raise ValueError("Esta transacción ya fue pagada anteriormente.")

        # 2. Lógica de negocio: Generar un hash simulado para el comprobante
        # Usamos el ID, el monto y la fecha actual para crear un hash único
        raw_string = f"{transaction.id}-{transaction.amount}-{time.time()}"
        receipt_hash = hashlib.sha256(raw_string.encode()).hexdigest()[:15].upper()

        # 3. Cambiar el estado de la entidad
        transaction.mark_as_success(f"RCPT-{receipt_hash}")

        # 4. Guardar en PostgreSQL y MongoDB
        self.transaction_repository.save(transaction)

        # 5. PUBLICAR EL EVENTO (RabbitMQ)
        self.event_publisher.publish_payment_completed(transaction)

        return transaction
