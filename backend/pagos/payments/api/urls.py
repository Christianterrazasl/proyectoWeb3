from django.urls import path
from .views import CreatePaymentView, ConfirmPaymentView, GetPaymentView, AdminTransactionListView

urlpatterns = [
    path('payments/qr', CreatePaymentView.as_view(), name='create_payment_qr'),
    path('payments/confirm', ConfirmPaymentView.as_view(), name='confirm_payment'),
    path('payments/admin/transactions', AdminTransactionListView.as_view(), name='admin_transactions_list'),
    path('payments/<str:transaction_id>', GetPaymentView.as_view(), name='get_payment'),
]