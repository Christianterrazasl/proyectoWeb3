import base64
from io import BytesIO
from types import SimpleNamespace

try:
    import qrcode
except ImportError:
    def _qrcode_unavailable(*_args, **_kwargs):
        raise RuntimeError("La librería qrcode no está instalada.")

    qrcode = SimpleNamespace(make=_qrcode_unavailable)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from ..application.commands import CreateTransactionDTO, CreateTransactionCommandHandler, DTOValidationError
from ..infrastructure.repositories_impl import TransactionRepositoryImpl

from ..application.commands import ConfirmPaymentDTO, ConfirmPaymentCommandHandler, DebtSyncPendingError
from ..infrastructure.rabbitmq_publisher import RabbitMQPublisher

from ..application.queries import GetTransactionQueryHandler

from django.http import HttpResponse


def _confirmation_payload(transaction):
    receipt_available = transaction.status.value == "SUCCESS"
    return {
        "transaction_id": transaction.id,
        "status": transaction.status.value,
        "receipt_hash": transaction.receipt_hash if receipt_available else None,
        "receipt_available": receipt_available,
    }

class CreatePaymentView(APIView):
    """
    POST /api/payments/qr.

    Receives frontend payment intent data, delegates the exact debt validation to
    the application layer, and only then returns a simulated QR payload.
    """

    def post(self, request):
        try:
            # The DTO validates caller input. The handler will then ask `deudas`
            # for the authoritative debt row before anything is persisted.
            dto = CreateTransactionDTO(**request.data)

            repository = TransactionRepositoryImpl()
            handler = CreateTransactionCommandHandler(repository)
            transaction = handler.execute(dto)

            # The QR data is derived from the transaction id generated after the
            # exact-debt contract succeeds; it is not a source of truth itself.
            qr_data = f"multipagos://pay/{transaction.id}"
            img = qrcode.make(qr_data)

            buffered = BytesIO()
            img.save(buffered, format="PNG")
            qr_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

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

        except DTOValidationError as e:
            # Captura errores si el JSON del frontend viene mal formado
            return Response({
                "success": False,
                "message": "Error de validación de datos",
                "errors": e.errors()
            }, status=status.HTTP_400_BAD_REQUEST)

        except ValueError as e:
            return Response({
                "success": False,
                "message": str(e)
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
    POST /api/payments/confirm.

    Loads the stored transaction from `pagos`, runs the confirmation use case,
    and returns the resulting payment state to the caller.
    """

    def post(self, request):
        try:
            dto = ConfirmPaymentDTO(**request.data)

            repository = TransactionRepositoryImpl()
            publisher = RabbitMQPublisher()
            handler = ConfirmPaymentCommandHandler(repository, publisher)

            transaction = handler.execute(dto)

            message = "Pago procesado y confirmado con éxito."
            if transaction.status.value == "FAILED":
                message = "Pago rechazado correctamente."

            return Response({
                "success": True,
                "message": message,
                "data": _confirmation_payload(transaction)
            }, status=status.HTTP_200_OK)

        except DebtSyncPendingError as e:
            return Response({
                "success": False,
                "message": str(e),
                "error_code": e.error_code,
                "retryable": e.retryable,
                "data": _confirmation_payload(e.transaction)
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        except ValueError as e:
            # Errores de negocio (ej: no existe, ya fue pagada)
            return Response({"success": False, "message": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        except DTOValidationError as e:
            return Response({"success": False, "errors": e.errors()}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"success": False, "message": "Error interno del servidor"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GetPaymentView(APIView):
    """
    GET /api/payments/{transaction_id}.

    Reads the current payment snapshot from the query layer. This is a read-only
    endpoint; it does not talk to `deudas` or mutate transaction state.
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

from django.http import HttpResponse
from ..application.queries import GetTransactionQueryHandler

class DownloadReceiptView(APIView):
    """
    GET /api/payments/{transaction_id}/receipt.

    Builds a simple HTML receipt from the stored transaction snapshot. Receipts
    exist only for `SUCCESS` transactions, so the source of truth remains the
    persisted transaction state.
    """
    def get(self, request, transaction_id):
        handler = GetTransactionQueryHandler()
        transaction = handler.execute(transaction_id)

        if not transaction or transaction.get("status") != "SUCCESS":
            return HttpResponse("<h1>Comprobante no disponible o pago no exitoso.</h1>", status=404)

        html_content = f"""
        <html>
        <head>
            <title>Comprobante de Pago</title>
            <style>
                body {{ font-family: 'Arial', sans-serif; background-color: #f4f4f9; padding: 40px; }}
                .receipt-box {{ max-width: 600px; margin: auto; background: white; padding: 30px; 
                                border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); border-top: 5px solid #4CAF50; }}
                .header {{ text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 20px; }}
                .header h1 {{ color: #4CAF50; margin: 0; }}
                .details {{ margin-top: 20px; font-size: 16px; line-height: 1.6; }}
                .details span {{ font-weight: bold; color: #333; }}
                .amount {{ font-size: 24px; text-align: center; color: #2c3e50; font-weight: bold; margin: 30px 0; }}
                .footer {{ text-align: center; font-size: 12px; color: #888; margin-top: 40px; }}
            </style>
        </head>
        <body>
            <div class="receipt-box">
                <div class="header">
                    <h1>Multipagos QR</h1>
                    <p>Comprobante de Transacción Exitosa</p>
                </div>
                <div class="amount">
                    Total Pagado: Bs. {transaction.get('amount')}
                </div>
                <div class="details">
                    <p><span>Recibo ID:</span> {transaction.get('receipt_hash')}</p>
                    <p><span>Transacción ID:</span> {transaction.get('id')}</p>
                    <p><span>Código Cliente:</span> {transaction.get('customer_ref')}</p>
                    <p><span>Fecha de Pago:</span> {transaction.get('created_at')}</p>
                    <p><span>Empresa Destino (Tenant):</span> {transaction.get('tenant_id')}</p>
                </div>
                <div class="footer">
                    Este documento es un comprobante válido generado electrónicamente.<br>
                    Gracias por utilizar Multipagos QR.
                </div>
            </div>
            <script>
                // Opcional: Descomentar esto para que se abra la ventana de guardar PDF automáticamente
                // window.onload = function() {{ window.print(); }}
            </script>
        </body>
        </html>
        """
        return HttpResponse(html_content, content_type="text/html")
