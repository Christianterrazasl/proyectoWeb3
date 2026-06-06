import base64
from datetime import datetime, time
from io import BytesIO
import qrcode
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from pydantic import ValidationError

from ..application.commands import CreateTransactionDTO, CreateTransactionCommandHandler
from ..infrastructure.repositories_impl import TransactionRepositoryImpl

from ..application.commands import ConfirmPaymentDTO, ConfirmPaymentCommandHandler
from ..infrastructure.rabbitmq_publisher import RabbitMQPublisher

from ..application.queries import (
    AdminTransactionFilters,
    GetTransactionQueryHandler,
    ListAdminTransactionsQueryHandler,
)


def _parse_filter_datetime(raw_value: str, field_name: str, end_of_day: bool = False) -> datetime:
    """Normaliza filtros de fecha para que la API admin acepte ISO completo o solo YYYY-MM-DD."""
    parsed_datetime = parse_datetime(raw_value)
    if parsed_datetime:
        return _ensure_aware_datetime(parsed_datetime)

    parsed_date = parse_date(raw_value)
    if parsed_date:
        selected_time = time.max if end_of_day else time.min
        return _ensure_aware_datetime(datetime.combine(parsed_date, selected_time))

    raise ValueError(
        f"El filtro '{field_name}' debe venir en formato ISO 8601 o YYYY-MM-DD."
    )


def _ensure_aware_datetime(value: datetime) -> datetime:
    """Convierte fechas naive al timezone actual antes de consultar la proyección."""
    if timezone.is_naive(value):
        return timezone.make_aware(value, timezone.get_current_timezone())

    return value


def _normalize_status_filter(raw_status: str | None) -> str | None:
    """Homologa el estado para que el repositorio compare contra el valor persistido."""
    if raw_status is None:
        return None

    normalized_status = raw_status.strip().upper()
    return normalized_status or None


def _build_admin_transaction_filters(query_params) -> AdminTransactionFilters:
    """Traduce query params HTTP al objeto de filtros que entiende el caso de uso admin."""
    created_from = None
    created_to = None

    if query_params.get('from'):
        created_from = _parse_filter_datetime(query_params.get('from'), 'from')

    if query_params.get('to'):
        created_to = _parse_filter_datetime(query_params.get('to'), 'to', end_of_day=True)

    if created_from and created_to and created_from > created_to:
        raise ValueError("El rango de fechas es inválido: 'from' no puede ser mayor que 'to'.")

    return AdminTransactionFilters(
        tenant_id=query_params.get('tenant_id') or None,
        service_id=query_params.get('service_id') or None,
        status=_normalize_status_filter(query_params.get('status')),
        customer_ref=query_params.get('customer_ref') or None,
        created_from=created_from,
        created_to=created_to,
    )

class CreatePaymentView(APIView):
    """
    Controlador para POST /api/payments/qr
    """

    def post(self, request):
        try:
            # 1. Validar el body de la petición usando Pydantic
            # Si falta un campo o el 'amount' es negativo, esto lanzará un ValidationError
            dto = CreateTransactionDTO(**request.data)

            # 2. Inyectar dependencias y ejecutar el caso de uso
            repository = TransactionRepositoryImpl()
            handler = CreateTransactionCommandHandler(repository)
            transaction = handler.execute(dto)

            # 3. Generar el código QR simulado
            # En la vida real esto sería un string complejo del banco.
            # Para nuestro caso de estudio, armamos una URI simulada con el ID.
            qr_data = f"multipagos://pay/{transaction.id}"
            img = qrcode.make(qr_data)

            # Convertir la imagen del QR a Base64 para enviarla por JSON
            buffered = BytesIO()
            img.save(buffered, format="PNG")
            qr_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

            # 4. Formatear la respuesta para el frontend
            response_data = {
                "success": True,
                "message": "Intención de pago generada y QR creado.",
                "data": {
                    "transaction_id": transaction.id,
                    "status": transaction.status.value,
                    "amount": transaction.amount,
                    "qr_code_base64": f"data:image/png;base64,{qr_base64}"
                }
            }
            return Response(response_data, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            # Captura errores si el JSON del frontend viene mal formado
            return Response({
                "success": False,
                "message": "Error de validación de datos",
                "errors": e.errors()
            }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            # Captura cualquier otro error interno
            return Response({
                "success": False,
                "message": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
#---------------------
class ConfirmPaymentView(APIView):
    """
    Controlador para POST /api/payments/confirm
    Simula la confirmación de pago por parte del banco.
    """

    def post(self, request):
        try:
            dto = ConfirmPaymentDTO(**request.data)

            repository = TransactionRepositoryImpl()
            publisher = RabbitMQPublisher()  # Instanciamos nuestro megáfono
            handler = ConfirmPaymentCommandHandler(repository, publisher)

            transaction = handler.execute(dto)

            return Response({
                "success": True,
                "message": "Pago procesado y confirmado con éxito.",
                "data": {
                    "transaction_id": transaction.id,
                    "status": transaction.status.value,
                    "receipt_hash": transaction.receipt_hash
                }
            }, status=status.HTTP_200_OK)

        except ValueError as e:
            # Errores de negocio (ej: no existe, ya fue pagada)
            return Response({"success": False, "message": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        except ValidationError as e:
            return Response({"success": False, "errors": e.errors()}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"success": False, "message": "Error interno del servidor"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
#-------------------
# --- NUEVO CÓDIGO ---

class GetPaymentView(APIView):
    """
    Controlador para GET /api/payments/{transaction_id}
    Devuelve el estado actual de un pago.
    """
    def get(self, request, transaction_id):
        try:
            handler = GetTransactionQueryHandler()
            transaction_data = handler.execute(transaction_id)

            if not transaction_data:
                return Response({
                    "success": False,
                    "message": "Transacción no encontrada."
                }, status=status.HTTP_404_NOT_FOUND)

            return Response({
                "success": True,
                "data": transaction_data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                "success": False,
                "message": f"Error interno: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminTransactionListView(APIView):
    """
    Controlador para GET /api/payments/admin/transactions.
    `pagos` conserva esta lectura porque es el dueño de las transacciones que luego consume `reportes`.
    """

    def get(self, request):
        try:
            # `reportes` puede reenviar `tenant_id` cuando auth resolvió un scope por empresa.
            # Si no llega ese filtro, la vista admin permanece global dentro de `pagos`.
            filters = _build_admin_transaction_filters(request.query_params)

            repository = TransactionRepositoryImpl()
            handler = ListAdminTransactionsQueryHandler(repository)
            transactions = handler.execute(filters)

            return Response({
                "success": True,
                "data": transactions
            }, status=status.HTTP_200_OK)

        except ValueError as e:
            return Response({
                "success": False,
                "message": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

        except Exception:
            return Response({
                "success": False,
                "message": "Error interno del servidor"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
