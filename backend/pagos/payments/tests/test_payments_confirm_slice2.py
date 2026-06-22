"""Protects confirmation semantics while debt sync is still external.

The non-obvious rule is simple: an approval is only `SUCCESS` after `deudas`
accepts the debt status update. If that sync fails, `pagos` must stay `PENDING`
and surface a retryable error instead of publishing an inconsistent success.
"""

from datetime import datetime
from importlib import import_module
from unittest.mock import Mock, patch

from django.conf import settings
from django.test import SimpleTestCase, override_settings
from rest_framework import status
from rest_framework.test import APIRequestFactory

from payments.application.commands import (
    ConfirmPaymentCommandHandler,
    ConfirmPaymentDTO,
    DebtSyncPendingError,
)
from payments.domain.models import Transaction, TransactionStatus


class FakeResponse:
    def __init__(self, status_code, payload):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        return self._payload


def build_transaction(status=TransactionStatus.PENDING, receipt_hash=None):
    return Transaction(
        id="txn-123",
        debt_id=45,
        tenant_id="tenant-1",
        service_id="gas",
        customer_ref="9988",
        amount=44,
        status=status,
        created_at=datetime(2026, 6, 18, 10, 0, 0),
        receipt_hash=receipt_hash,
    )


class ConfirmPaymentCommandHandlerTests(SimpleTestCase):
    def setUp(self):
        self.repository = Mock()
        self.publisher = Mock()
        self.handler = ConfirmPaymentCommandHandler(self.repository, self.publisher)

    @patch("payments.application.commands.hashlib.sha256")
    @patch("payments.application.commands.requests.patch")
    def test_approve_confirms_the_debt_before_persisting_success_and_publishing(
        self,
        mocked_patch,
        mocked_sha256,
    ):
        transaction = build_transaction()
        self.repository.find_by_id.return_value = transaction
        mocked_patch.return_value = FakeResponse(200, {"success": True})
        mocked_sha256.return_value.hexdigest.return_value = "abc123def456789"
        execution_order = []

        def patch_side_effect(*args, **kwargs):
            execution_order.append("patch")
            return mocked_patch.return_value

        def save_side_effect(saved_transaction):
            execution_order.append(f"save:{saved_transaction.status.value}")

        def publish_side_effect(_transaction):
            execution_order.append("publish")

        mocked_patch.side_effect = patch_side_effect
        self.repository.save.side_effect = save_side_effect
        self.publisher.publish_payment_completed.side_effect = publish_side_effect

        confirmed = self.handler.execute(ConfirmPaymentDTO(transaction_id="txn-123", action="APPROVE"))

        mocked_patch.assert_called_once_with(
            "http://deudas:3000/admin/debts/45/status",
            json={"status": "PAID"},
            timeout=5,
        )
        self.assertEqual(execution_order, ["patch", "save:SUCCESS", "publish"])
        self.assertEqual(confirmed.status, TransactionStatus.SUCCESS)
        self.assertEqual(confirmed.receipt_hash, "RCPT-ABC123DEF456789")

    @patch("payments.application.commands.requests.patch")
    def test_reject_marks_the_transaction_as_failed_without_sync_or_event(self, mocked_patch):
        transaction = build_transaction()
        self.repository.find_by_id.return_value = transaction

        rejected = self.handler.execute(ConfirmPaymentDTO(transaction_id="txn-123", action="REJECT"))

        self.assertEqual(rejected.status, TransactionStatus.FAILED)
        self.assertIsNone(rejected.receipt_hash)
        self.repository.save.assert_called_once_with(transaction)
        mocked_patch.assert_not_called()
        self.publisher.publish_payment_completed.assert_not_called()

    @patch("payments.application.commands.requests.patch")
    def test_retrying_an_already_successful_approval_is_idempotent(self, mocked_patch):
        transaction = build_transaction(
            status=TransactionStatus.SUCCESS,
            receipt_hash="RCPT-EXISTING12345",
        )
        self.repository.find_by_id.return_value = transaction

        confirmed = self.handler.execute(ConfirmPaymentDTO(transaction_id="txn-123", action="APPROVE"))

        self.assertEqual(confirmed.status, TransactionStatus.SUCCESS)
        self.assertEqual(confirmed.receipt_hash, "RCPT-EXISTING12345")
        self.repository.save.assert_not_called()
        mocked_patch.assert_not_called()
        self.publisher.publish_payment_completed.assert_not_called()

    @patch("payments.application.commands.hashlib.sha256")
    @patch("payments.application.commands.requests.patch")
    def test_approve_keeps_the_transaction_pending_when_debt_sync_fails(
        self,
        mocked_patch,
        mocked_sha256,
    ):
        transaction = build_transaction()
        self.repository.find_by_id.return_value = transaction
        mocked_patch.return_value = FakeResponse(503, {"success": False})
        mocked_sha256.return_value.hexdigest.return_value = "abc123def456789"

        with self.assertRaisesMessage(
            DebtSyncPendingError,
            "El pago fue aprobado, pero la deuda no pudo sincronizarse. Reintente la confirmación.",
        ) as error:
            self.handler.execute(ConfirmPaymentDTO(transaction_id="txn-123", action="APPROVE"))

        self.assertEqual(error.exception.transaction.status, TransactionStatus.PENDING)
        self.assertIsNone(error.exception.transaction.receipt_hash)
        self.repository.save.assert_not_called()
        self.publisher.publish_payment_completed.assert_not_called()


@override_settings(INSTALLED_APPS=settings.INSTALLED_APPS + ["payments"])
class ConfirmPaymentViewTests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    def _view(self):
        module = import_module("payments.api.views")
        return module.ConfirmPaymentView.as_view()

    @patch("payments.api.views.ConfirmPaymentCommandHandler")
    @patch("payments.api.views.RabbitMQPublisher")
    @patch("payments.api.views.TransactionRepositoryImpl")
    def test_confirm_returns_receipt_availability_only_for_real_success(
        self,
        _mocked_repository_class,
        _mocked_publisher_class,
        mocked_handler_class,
    ):
        mocked_handler_class.return_value.execute.return_value = build_transaction(
            status=TransactionStatus.SUCCESS,
            receipt_hash="RCPT-OK1234567890",
        )
        request = self.factory.post(
            "/api/payments/confirm",
            {"transaction_id": "txn-123", "action": "APPROVE"},
            format="json",
        )

        response = self._view()(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["success"], True)
        self.assertEqual(response.data["data"]["status"], "SUCCESS")
        self.assertEqual(response.data["data"]["receipt_hash"], "RCPT-OK1234567890")
        self.assertEqual(response.data["data"]["receipt_available"], True)

    @patch("payments.api.views.ConfirmPaymentCommandHandler")
    @patch("payments.api.views.RabbitMQPublisher")
    @patch("payments.api.views.TransactionRepositoryImpl")
    def test_confirm_reject_response_keeps_receipt_unavailable(
        self,
        _mocked_repository_class,
        _mocked_publisher_class,
        mocked_handler_class,
    ):
        mocked_handler_class.return_value.execute.return_value = build_transaction(
            status=TransactionStatus.FAILED,
            receipt_hash=None,
        )
        request = self.factory.post(
            "/api/payments/confirm",
            {"transaction_id": "txn-123", "action": "REJECT"},
            format="json",
        )

        response = self._view()(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["success"], True)
        self.assertEqual(response.data["data"]["status"], "FAILED")
        self.assertIsNone(response.data["data"]["receipt_hash"])
        self.assertEqual(response.data["data"]["receipt_available"], False)

    @patch("payments.api.views.ConfirmPaymentCommandHandler")
    @patch("payments.api.views.RabbitMQPublisher")
    @patch("payments.api.views.TransactionRepositoryImpl")
    def test_confirm_sync_failure_returns_explicit_retryable_error(
        self,
        _mocked_repository_class,
        _mocked_publisher_class,
        mocked_handler_class,
    ):
        # The view must preserve the retry path instead of pretending approval is final.
        mocked_handler_class.return_value.execute.side_effect = DebtSyncPendingError(build_transaction())
        request = self.factory.post(
            "/api/payments/confirm",
            {"transaction_id": "txn-123", "action": "APPROVE"},
            format="json",
        )

        response = self._view()(request)

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data["success"], False)
        self.assertEqual(response.data["error_code"], "DEBT_SYNC_PENDING")
        self.assertEqual(response.data["retryable"], True)
        self.assertEqual(response.data["data"]["status"], "PENDING")
        self.assertEqual(response.data["data"]["receipt_available"], False)
        self.assertIsNone(response.data["data"]["receipt_hash"])
