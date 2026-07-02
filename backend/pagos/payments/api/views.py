import io
import base64
import qrcode
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
from rest_framework.exceptions import AuthenticationFailed

from ..domain.models import TransactionStatus
from ..domain.shared.core.business_rule_validation_exception import BusinessRuleValidationException
from ..application.commands import CreateTransactionCommandHandler, ConfirmPaymentCommandHandler, DebtSyncPendingError
from ..application.queries import GetTransactionQueryHandler, ListTransactionsQueryHandler
from .auth import CustomJWTAuthentication
from .receipt_html import render_receipt_html
from ..infrastructure.repositories_impl import TransactionRepositoryImpl
from ..infrastructure.rabbitmq_publisher import RabbitMQEventPublisher

# Instanciamos la infraestructura compartida para las vistas
repo = TransactionRepositoryImpl()
publisher = RabbitMQEventPublisher()

def _get_request_scope(request) -> dict:
    auth_result = CustomJWTAuthentication().authenticate(request)

    if auth_result is None:
        return {
            'tenant_id': None,
            'global_role': None,
        }

    return {
        'tenant_id': str(request.tenant_id) if getattr(request, 'tenant_id', None) not in (None, '') else None,
        'global_role': getattr(request, 'role', None),
    }


def _build_list_filters(request, scope: dict) -> dict:
    filters = {
        key: value
        for key, value in request.query_params.items()
        if value not in (None, '')
    }

    scoped_tenant_id = scope.get('tenant_id')
    global_role = (scope.get('global_role') or '').lower()

    # El listado mantiene el contrato real `GET /api/payments`, pero si la
    # request ya viene acotada a una empresa concreta no dejamos que un caller
    # no-admin amplíe el alcance por query params.
    if scoped_tenant_id and (global_role != 'admin' or 'tenant_id' not in filters):
        filters['tenant_id'] = scoped_tenant_id

    return filters


class CreatePaymentView(APIView):
    def post(self, request):
        try:
            handler = CreateTransactionCommandHandler(repo)
            transaction = handler.execute(request.data)

            # Mantenemos tu flujo visual de renderizado de QR en Base64
            qr_data = f"https://multipagos.sur/pay/{transaction.id}"
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(qr_data)
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")

            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            qr_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

            return Response({
                "success": True,
                "transaction_id": transaction.id,
                "qr_code": f"data:image/png;base64,{qr_base64}",
                "amount": transaction.amount
            }, status=status.HTTP_201_CREATED)

        except (BusinessRuleValidationException, ValueError) as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"success": False, "message": f"Error interno: {str(e)}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ConfirmPaymentView(APIView):
    def post(self, request):
        try:
            handler = ConfirmPaymentCommandHandler(repo, publisher)
            transaction = handler.execute(request.data)
            return Response({
                "success": True,
                "message": f"Transacción procesada con estado: {transaction.status.value}",
                "transaction_status": transaction.status.value,
                "receipt_hash": transaction.receipt_hash,
                "receipt_available": transaction.status == TransactionStatus.SUCCESS,
            }, status=status.HTTP_200_OK)

        except DebtSyncPendingError as e:
            return Response({
                "success": False,
                "message": str(e),
                "error_code": "DEBT_SYNC_PENDING",
                "retryable": True,
                "transaction_status": "PENDING",
                "receipt_available": False,
            }, status=status.HTTP_409_CONFLICT)
        except (BusinessRuleValidationException, ValueError) as e:
            return Response({"success": False, "message": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"success": False, "message": f"Error interno: {str(e)}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ListPaymentsView(APIView):
    def get(self, request):
        try:
            if not request.headers.get('Authorization'):
                return Response(
                    {"success": False, "message": "Autorización requerida."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            scope = _get_request_scope(request)
            # El query handler recibe filtros ya "cerrados" por rol/tenant para que
            # reportes y admin reutilicen la misma vista sin duplicar reglas de alcance.
            filters = _build_list_filters(request, scope)
            handler = ListTransactionsQueryHandler()
            transactions = handler.execute(filters, scope=scope)

            return Response(
                {"success": True, "data": transactions},
                status=status.HTTP_200_OK,
            )

        except AuthenticationFailed as error:
            return Response(
                {"success": False, "message": str(error)},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        except Exception as e:
            return Response(
                {"success": False, "message": f"Error interno: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class GetPaymentView(APIView):
    def get(self, request, transaction_id):
        try:
            handler = GetTransactionQueryHandler()
            transaction_data = handler.execute(transaction_id)

            if not transaction_data:
                return Response({"success": False, "message": "Transacción no encontrada."},
                                status=status.HTTP_404_NOT_FOUND)

            return Response({"success": True, "data": transaction_data}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"success": False, "message": f"Error interno: {str(e)}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DownloadReceiptView(APIView):
    def get(self, request, transaction_id):
        handler = GetTransactionQueryHandler()
        transaction = handler.execute(transaction_id)

        if not transaction or transaction.get("status") != "SUCCESS":
            body = (
                "<!DOCTYPE html><html lang=\"es\"><head><meta charset=\"UTF-8\" />"
                "<title>Comprobante no disponible</title></head><body>"
                "<h1>Comprobante no disponible o pago no exitoso.</h1></body></html>"
            ).encode("utf-8")
            return HttpResponse(body, status=404, content_type="text/html; charset=utf-8")

        response = HttpResponse(
            render_receipt_html(transaction),
            content_type="text/html; charset=utf-8",
        )
        response.charset = "utf-8"
        return response
