"""Protects the QR contract for one exact pending debt.

These regressions stay next to `payments` because they lock the pagos-side
boundary with `deudas`: QR creation is allowed only for the one pending debt
identified by `debt_id + tenant_id + service_id + customer_ref`.
"""

from importlib import import_module
from unittest.mock import Mock, patch

from django.conf import settings
from django.test import SimpleTestCase, override_settings
from rest_framework import status
from rest_framework.test import APIRequestFactory

from payments.application.commands import CreateTransactionCommandHandler, CreateTransactionDTO
from payments.domain.models import TransactionStatus


class FakeResponse:
    def __init__(self, status_code, payload):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        return self._payload


class DummyQrImage:
    def save(self, buffer, format):
        buffer.write(b"fake-png")


class CreateTransactionCommandHandlerTests(SimpleTestCase):
    def setUp(self):
        self.repository = Mock()
        self.handler = CreateTransactionCommandHandler(self.repository)

    def test_create_transaction_dto_requires_debt_id(self):
        with self.assertRaises(Exception) as error:
            CreateTransactionDTO(
                tenant_id="tenant-1",
                service_id="gas",
                customer_ref="9988",
                amount=44,
            )

        self.assertEqual(error.exception.errors()[0]["loc"][-1], "debt_id")

    @patch("payments.application.commands.requests.get")
    def test_create_transaction_saves_the_exact_pending_debt_identity(self, mocked_get):
        # `deudas` is the source of truth for debt identity, so `pagos` must see
        # exactly one matching pending debt before persisting a QR intent.
        mocked_get.return_value = FakeResponse(
            200,
            [
                {
                    "id": 45,
                    "tenant_id": "tenant-1",
                    "service_id": "gas",
                    "customer_ref": "9988",
                    "amount": 44,
                    "status": "PENDING",
                }
            ],
        )

        transaction = self.handler.execute(
            CreateTransactionDTO(
                debt_id=45,
                tenant_id="tenant-1",
                service_id="gas",
                customer_ref="9988",
                amount=44,
            )
        )

        mocked_get.assert_called_once_with(
            "http://deudas:3000/debts?id=45&tenant_id=tenant-1&service_id=gas&customer_ref=9988&status=PENDING",
            timeout=5,
        )
        self.repository.save.assert_called_once()
        saved_transaction = self.repository.save.call_args.args[0]
        self.assertEqual(saved_transaction.debt_id, 45)
        self.assertEqual(saved_transaction.status, TransactionStatus.PENDING)
        self.assertEqual(transaction.debt_id, 45)

    @patch("payments.application.commands.requests.get")
    def test_create_transaction_rejects_when_the_exact_debt_does_not_exist(self, mocked_get):
        mocked_get.return_value = FakeResponse(200, [])

        with self.assertRaisesMessage(ValueError, "La deuda exacta no existe o ya no está pendiente."):
            self.handler.execute(
                CreateTransactionDTO(
                    debt_id=45,
                    tenant_id="tenant-1",
                    service_id="gas",
                    customer_ref="9988",
                    amount=44,
                )
            )

        self.repository.save.assert_not_called()

    @patch("payments.application.commands.requests.get")
    def test_create_transaction_rejects_when_the_exact_debt_amount_does_not_match(self, mocked_get):
        mocked_get.return_value = FakeResponse(
            200,
            [
                {
                    "id": 45,
                    "tenant_id": "tenant-1",
                    "service_id": "gas",
                    "customer_ref": "9988",
                    "amount": 55,
                    "status": "PENDING",
                }
            ],
        )

        with self.assertRaisesMessage(ValueError, "Monto incorrecto. La deuda real es de 55"):
            self.handler.execute(
                CreateTransactionDTO(
                    debt_id=45,
                    tenant_id="tenant-1",
                    service_id="gas",
                    customer_ref="9988",
                    amount=44,
                )
            )

        self.repository.save.assert_not_called()


@override_settings(INSTALLED_APPS=settings.INSTALLED_APPS + ["payments"])
class CreatePaymentViewTests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    def _view(self):
        module = import_module("payments.api.views")
        return module.CreatePaymentView.as_view()

    def test_post_qr_returns_400_when_debt_id_is_missing(self):
        request = self.factory.post(
            "/api/payments/qr",
            {
                "tenant_id": "tenant-1",
                "service_id": "gas",
                "customer_ref": "9988",
                "amount": 44,
            },
            format="json",
        )

        response = self._view()(request)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["success"], False)
        self.assertEqual(response.data["message"], "Error de validación de datos")
        self.assertEqual(response.data["errors"][0]["loc"][-1], "debt_id")

    @patch("payments.application.commands.requests.get")
    @patch("payments.api.views.qrcode.make", return_value=DummyQrImage())
    @patch("payments.api.views.TransactionRepositoryImpl")
    def test_post_qr_creates_a_pending_transaction_for_the_exact_debt(
        self,
        mocked_repository_class,
        _mocked_qr,
        mocked_get,
    ):
        mocked_repository_class.return_value = Mock()
        # The QR itself is only presentation. The contract this test protects is
        # the exact-debt validation that must pass before generating that artifact.
        mocked_get.return_value = FakeResponse(
            200,
            [
                {
                    "id": 45,
                    "tenant_id": "tenant-1",
                    "service_id": "gas",
                    "customer_ref": "9988",
                    "amount": 44,
                    "status": "PENDING",
                }
            ],
        )
        request = self.factory.post(
            "/api/payments/qr",
            {
                "debt_id": 45,
                "tenant_id": "tenant-1",
                "service_id": "gas",
                "customer_ref": "9988",
                "amount": 44,
            },
            format="json",
        )

        response = self._view()(request)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["success"], True)
        self.assertEqual(response.data["data"]["status"], "PENDING")
        self.assertEqual(response.data["data"]["amount"], 44)
        self.assertTrue(response.data["data"]["transaction_id"].startswith("txn-"))
        self.assertTrue(response.data["data"]["qr_code_base64"].startswith("data:image/png;base64,"))

    @patch("payments.application.commands.requests.get")
    @patch("payments.api.views.TransactionRepositoryImpl")
    def test_post_qr_returns_400_when_the_exact_debt_is_not_available(self, mocked_repository_class, mocked_get):
        mocked_repository = Mock()
        mocked_repository_class.return_value = mocked_repository
        mocked_get.return_value = FakeResponse(200, [])
        request = self.factory.post(
            "/api/payments/qr",
            {
                "debt_id": 45,
                "tenant_id": "tenant-1",
                "service_id": "gas",
                "customer_ref": "9988",
                "amount": 44,
            },
            format="json",
        )

        response = self._view()(request)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["success"], False)
        self.assertEqual(response.data["message"], "La deuda exacta no existe o ya no está pendiente.")
        mocked_repository.save.assert_not_called()

    @patch("payments.application.commands.requests.get")
    @patch("payments.api.views.TransactionRepositoryImpl")
    def test_post_qr_returns_400_when_the_exact_debt_amount_does_not_match(self, mocked_repository_class, mocked_get):
        mocked_repository = Mock()
        mocked_repository_class.return_value = mocked_repository
        mocked_get.return_value = FakeResponse(
            200,
            [
                {
                    "id": 45,
                    "tenant_id": "tenant-1",
                    "service_id": "gas",
                    "customer_ref": "9988",
                    "amount": 55,
                    "status": "PENDING",
                }
            ],
        )
        request = self.factory.post(
            "/api/payments/qr",
            {
                "debt_id": 45,
                "tenant_id": "tenant-1",
                "service_id": "gas",
                "customer_ref": "9988",
                "amount": 44,
            },
            format="json",
        )

        response = self._view()(request)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["success"], False)
        self.assertEqual(response.data["message"], "Monto incorrecto. La deuda real es de 55")
        mocked_repository.save.assert_not_called()
