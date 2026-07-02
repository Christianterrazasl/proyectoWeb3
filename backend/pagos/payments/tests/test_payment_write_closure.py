from datetime import datetime, timezone
from unittest.mock import Mock, patch

from django.test import SimpleTestCase, TestCase, override_settings
from rest_framework.test import APIRequestFactory

from payments.application.commands import (
    ConfirmPaymentCommandHandler,
    CreateTransactionCommandHandler,
    DebtSyncPendingError,
)
from payments.api.views import ConfirmPaymentView, CreatePaymentView, DownloadReceiptView
from payments.domain.models import Transaction, TransactionStatus
from payments.infrastructure.django_models import TransactionModel
from payments.infrastructure.repositories_impl import TransactionRepositoryImpl


@override_settings(
    DATABASES={
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
        }
    }
)
class CreateTransactionCommandHandlerTests(SimpleTestCase):
    @patch('payments.application.commands.requests.get')
    def test_create_transaction_requires_exact_pending_debt(self, requests_get_mock):
        repository = Mock()
        response = Mock(status_code=200, ok=True)
        response.json.return_value = [
            {
                'id': 45,
                'tenant_id': 'tenant-1',
                'service_id': 'gas',
                'customer_ref': '9988',
                'amount': 44,
                'status': 'PENDING',
            }
        ]
        requests_get_mock.return_value = response

        transaction = CreateTransactionCommandHandler(repository).execute(
            {
                'debt_id': 45,
                'tenant_id': 'tenant-1',
                'service_id': 'gas',
                'customer_ref': '9988',
                'amount': 44,
            }
        )

        self.assertEqual(transaction.debt_id, 45)
        self.assertEqual(transaction.status, TransactionStatus.PENDING)
        repository.save.assert_called_once()
        requests_get_mock.assert_called_once_with(
            'http://deudas:3000/debts',
            params={
                'id': 45,
                'tenant_id': 'tenant-1',
                'service_id': 'gas',
                'customer_ref': '9988',
                'status': 'PENDING',
            },
            timeout=5,
        )

    @patch('payments.application.commands.requests.get')
    def test_create_transaction_rejects_missing_or_mismatched_debt(self, requests_get_mock):
        repository = Mock()
        handler = CreateTransactionCommandHandler(repository)

        with self.assertRaisesMessage(ValueError, 'debt_id obligatorio'):
            handler.execute(
                {
                    'tenant_id': 'tenant-1',
                    'service_id': 'gas',
                    'customer_ref': '9988',
                    'amount': 44,
                }
            )

        mismatch_response = Mock(status_code=200, ok=True)
        mismatch_response.json.return_value = [
            {
                'id': 45,
                'tenant_id': 'tenant-1',
                'service_id': 'gas',
                'customer_ref': '9988',
                'amount': 50,
                'status': 'PENDING',
            }
        ]
        requests_get_mock.return_value = mismatch_response

        with self.assertRaisesMessage(ValueError, 'Monto incorrecto'):
            handler.execute(
                {
                    'debt_id': 45,
                    'tenant_id': 'tenant-1',
                    'service_id': 'gas',
                    'customer_ref': '9988',
                    'amount': 44,
                }
            )

        repository.save.assert_not_called()


class PaymentWriteViewsTests(SimpleTestCase):
    @patch('payments.api.views.repo')
    def test_create_payment_returns_400_when_debt_id_is_missing(self, _repo_mock):
        request = APIRequestFactory().post(
            '/api/payments/qr',
            {
                'tenant_id': 'tenant-1',
                'service_id': 'gas',
                'customer_ref': '9988',
                'amount': 44,
            },
            format='json',
        )

        response = CreatePaymentView.as_view()(request)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['success'], False)
        self.assertIn('debt_id', response.data['message'])

    @patch('payments.api.views.ConfirmPaymentCommandHandler.execute')
    def test_confirm_payment_returns_retryable_conflict_when_sync_fails(self, execute_mock):
        execute_mock.side_effect = DebtSyncPendingError('No se pudo sincronizar la deuda exacta.')
        request = APIRequestFactory().post(
            '/api/payments/confirm',
            {'transaction_id': 'txn-2', 'action': 'APPROVE'},
            format='json',
        )

        response = ConfirmPaymentView.as_view()(request)

        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.data, {
            'success': False,
            'message': 'No se pudo sincronizar la deuda exacta.',
            'error_code': 'DEBT_SYNC_PENDING',
            'retryable': True,
            'transaction_status': 'PENDING',
            'receipt_available': False,
        })

    @patch('payments.api.views.GetTransactionQueryHandler.execute')
    def test_download_receipt_returns_html_for_successful_payment(self, execute_mock):
        execute_mock.return_value = {
            'id': 'txn-10',
            'tenant_id': 'tenant-1',
            'customer_ref': '9988',
            'amount': 44,
            'status': 'SUCCESS',
            'created_at': '2026-06-22T10:00:00+00:00',
            'receipt_hash': 'RCPT-OK',
        }
        request = APIRequestFactory().get('/api/payments/txn-10/receipt')

        response = DownloadReceiptView.as_view()(request, transaction_id='txn-10')

        self.assertEqual(response.status_code, 200)
        self.assertIn("charset=utf-8", response["Content-Type"])
        content = response.content.decode("utf-8")
        self.assertIn("Comprobante de pago", content)
        self.assertIn("Transacción exitosa", content)
        self.assertIn('RCPT-OK', content)
        self.assertIn('txn-10', content)
        self.assertIn('9988', content)
        self.assertIn('tenant-1', content)

    @patch('payments.api.views.GetTransactionQueryHandler.execute')
    def test_download_receipt_rejects_pending_or_unknown_payment(self, execute_mock):
        request = APIRequestFactory().get('/api/payments/txn-11/receipt')

        execute_mock.return_value = {
            'id': 'txn-11',
            'status': 'PENDING',
        }
        pending_response = DownloadReceiptView.as_view()(request, transaction_id='txn-11')

        self.assertEqual(pending_response.status_code, 404)
        self.assertIn('Comprobante no disponible', pending_response.content.decode('utf-8'))

        execute_mock.return_value = None
        missing_response = DownloadReceiptView.as_view()(request, transaction_id='txn-missing')

        self.assertEqual(missing_response.status_code, 404)
        self.assertIn('Comprobante no disponible', missing_response.content.decode('utf-8'))


class ConfirmPaymentCommandHandlerTests(SimpleTestCase):
    @patch('payments.application.commands.requests.patch')
    def test_confirm_approve_marks_exact_debt_paid_before_publishing(self, requests_patch_mock):
        transaction = Transaction(
            entity_id='txn-1',
            debt_id=45,
            tenant_id='tenant-1',
            service_id='gas',
            customer_ref='9988',
            amount=44,
            status=TransactionStatus.PENDING,
            created_at=datetime(2026, 6, 22, 10, 0, 0, tzinfo=timezone.utc),
        )
        repository = Mock()
        repository.find_by_id.return_value = transaction
        publisher = Mock()
        response = Mock(status_code=200, ok=True)
        response.json.return_value = {'success': True, 'data': {'id': 45, 'status': 'PAID'}}
        requests_patch_mock.return_value = response

        result = ConfirmPaymentCommandHandler(repository, publisher).execute(
            {'transaction_id': 'txn-1', 'action': 'APPROVE'}
        )

        self.assertEqual(result.status, TransactionStatus.SUCCESS)
        self.assertTrue(result.receipt_hash.startswith('RCPT-'))
        repository.save.assert_called_once_with(result)
        publisher.publish_payment_completed.assert_called_once_with(result)
        requests_patch_mock.assert_called_once_with(
            'http://deudas:3000/internal/debts/45/status',
            json={'status': 'PAID'},
            timeout=5,
        )

    @patch('payments.application.commands.requests.patch')
    def test_confirm_keeps_pending_and_allows_retry_when_debt_sync_fails(self, requests_patch_mock):
        transaction = Transaction(
            entity_id='txn-2',
            debt_id=45,
            tenant_id='tenant-1',
            service_id='gas',
            customer_ref='9988',
            amount=44,
            status=TransactionStatus.PENDING,
            created_at=datetime(2026, 6, 22, 10, 0, 0, tzinfo=timezone.utc),
        )
        repository = Mock()
        repository.find_by_id.side_effect = [transaction, transaction]
        publisher = Mock()

        failed_response = Mock(status_code=502, ok=False)
        failed_response.json.return_value = {'success': False}
        success_response = Mock(status_code=200, ok=True)
        success_response.json.return_value = {'success': True, 'data': {'id': 45, 'status': 'PAID'}}
        requests_patch_mock.side_effect = [failed_response, success_response]

        handler = ConfirmPaymentCommandHandler(repository, publisher)

        with self.assertRaises(DebtSyncPendingError):
            handler.execute({'transaction_id': 'txn-2', 'action': 'APPROVE'})

        self.assertEqual(transaction.status, TransactionStatus.PENDING)
        repository.save.assert_not_called()
        publisher.publish_payment_completed.assert_not_called()

        result = handler.execute({'transaction_id': 'txn-2', 'action': 'APPROVE'})

        self.assertEqual(result.status, TransactionStatus.SUCCESS)
        self.assertEqual(repository.save.call_count, 1)
        publisher.publish_payment_completed.assert_called_once_with(result)

    @patch('payments.application.commands.requests.patch')
    def test_confirm_treats_unsuccessful_sync_payload_as_retryable_failure(self, requests_patch_mock):
        transaction = Transaction(
            entity_id='txn-5',
            debt_id=45,
            tenant_id='tenant-1',
            service_id='gas',
            customer_ref='9988',
            amount=44,
            status=TransactionStatus.PENDING,
            created_at=datetime(2026, 6, 22, 10, 0, 0, tzinfo=timezone.utc),
        )
        repository = Mock()
        repository.find_by_id.return_value = transaction
        publisher = Mock()
        response = Mock(status_code=200, ok=True)
        response.json.return_value = {'success': False, 'message': 'sin permiso'}
        requests_patch_mock.return_value = response

        with self.assertRaises(DebtSyncPendingError):
            ConfirmPaymentCommandHandler(repository, publisher).execute(
                {'transaction_id': 'txn-5', 'action': 'APPROVE'}
            )

        self.assertEqual(transaction.status, TransactionStatus.PENDING)
        repository.save.assert_not_called()
        publisher.publish_payment_completed.assert_not_called()

    @patch('payments.application.commands.requests.patch')
    def test_confirm_reject_marks_failed_without_paying_debt(self, requests_patch_mock):
        transaction = Transaction(
            entity_id='txn-6',
            debt_id=55,
            tenant_id='tenant-1',
            service_id='gas',
            customer_ref='9988',
            amount=44,
            status=TransactionStatus.PENDING,
            created_at=datetime(2026, 6, 22, 10, 0, 0, tzinfo=timezone.utc),
        )
        repository = Mock()
        repository.find_by_id.return_value = transaction
        publisher = Mock()

        result = ConfirmPaymentCommandHandler(repository, publisher).execute(
            {'transaction_id': 'txn-6', 'action': 'REJECT'}
        )

        self.assertEqual(result.status, TransactionStatus.FAILED)
        self.assertIsNone(result.receipt_hash)
        repository.save.assert_called_once_with(result)
        publisher.publish_payment_completed.assert_not_called()
        requests_patch_mock.assert_not_called()

    @patch('payments.application.commands.requests.patch')
    def test_confirm_is_idempotent_for_terminal_transactions(self, requests_patch_mock):
        success_transaction = Transaction(
            entity_id='txn-3',
            debt_id=45,
            tenant_id='tenant-1',
            service_id='gas',
            customer_ref='9988',
            amount=44,
            status=TransactionStatus.SUCCESS,
            created_at=datetime(2026, 6, 22, 10, 0, 0, tzinfo=timezone.utc),
            receipt_hash='RCPT-OLD',
        )
        failed_transaction = Transaction(
            entity_id='txn-4',
            debt_id=46,
            tenant_id='tenant-1',
            service_id='gas',
            customer_ref='9988',
            amount=44,
            status=TransactionStatus.FAILED,
            created_at=datetime(2026, 6, 22, 10, 0, 0, tzinfo=timezone.utc),
        )
        repository = Mock()
        repository.find_by_id.side_effect = [success_transaction, failed_transaction]
        publisher = Mock()
        handler = ConfirmPaymentCommandHandler(repository, publisher)

        self.assertIs(
            handler.execute({'transaction_id': 'txn-3', 'action': 'APPROVE'}),
            success_transaction,
        )
        self.assertIs(
            handler.execute({'transaction_id': 'txn-4', 'action': 'REJECT'}),
            failed_transaction,
        )
        repository.save.assert_not_called()
        publisher.publish_payment_completed.assert_not_called()
        requests_patch_mock.assert_not_called()


@override_settings(
    DATABASES={
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
        }
    }
)
class TransactionRepositoryDebtIdTests(TestCase):
    @patch('payments.infrastructure.repositories_impl.transactions_collection.update_one')
    def test_repository_persists_and_restores_debt_id(self, mongo_update_mock):
        repository = TransactionRepositoryImpl()
        transaction = Transaction(
            entity_id='txn-9',
            debt_id=77,
            tenant_id='tenant-9',
            service_id='agua',
            customer_ref='A-1',
            amount=19.5,
            status=TransactionStatus.PENDING,
            created_at=datetime(2026, 6, 22, 12, 0, 0, tzinfo=timezone.utc),
        )

        repository.save(transaction)
        restored = repository.find_by_id('txn-9')

        self.assertEqual(restored.debt_id, 77)
        mongo_update_mock.assert_called_once()
        saved_payload = mongo_update_mock.call_args.args[1]['$set']
        self.assertEqual(saved_payload['debt_id'], 77)
