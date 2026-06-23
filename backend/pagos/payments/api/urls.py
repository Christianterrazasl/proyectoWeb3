from django.urls import path
from .views import CreatePaymentView, ConfirmPaymentView, ListPaymentsView, GetPaymentView, DownloadReceiptView

urlpatterns = [
    path('payments', ListPaymentsView.as_view(), name='list_payments'),
    path('payments/admin/transactions', ListPaymentsView.as_view(), name='list_payments_admin_alias'),
    path('payments/qr', CreatePaymentView.as_view(), name='create_payment_qr'),
    path('payments/confirm', ConfirmPaymentView.as_view(), name='confirm_payment'),
    path('payments/<str:transaction_id>', GetPaymentView.as_view(), name='get_payment'),
    path('payments/<str:transaction_id>/receipt', DownloadReceiptView.as_view(), name='download_receipt'),
]