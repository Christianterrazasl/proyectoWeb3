from unittest.mock import Mock, patch

import jwt
from django.test import SimpleTestCase, override_settings
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.test import APIRequestFactory


@override_settings(
    DATABASES={
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
        }
    }
)
class ListPaymentsContractViewTests(SimpleTestCase):
    @patch('payments.api.views.ListTransactionsQueryHandler.execute')
    @patch('payments.api.views._get_request_scope')
    def test_list_payments_uses_canonical_contract(self, scope_mock, execute_mock):
        scope_mock.return_value = {
            'tenant_id': 'empresa-1',
            'global_role': 'admin',
        }
        execute_mock.return_value = [
            {
                'id': 'txn-2',
                'debt_id': 45,
                'tenant_id': 'empresa-1',
                'service_id': 'svc-9',
                'customer_ref': 'C-100',
                'amount': 50,
                'status': 'SUCCESS',
                'created_at': '2026-06-22T10:30:00+00:00',
                'receipt_hash': 'rh-2',
            }
        ]

        response = self.client.get(
            '/api/payments',
            {
                'tenant_id': 'empresa-1',
                'service_id': 'svc-9',
                'status': 'SUCCESS',
                'customer_ref': 'C-100',
                'from': '2026-06-01T00:00:00+00:00',
                'to': '2026-06-22T23:59:59+00:00',
            },
            HTTP_AUTHORIZATION='Bearer token-prueba',
        )

        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(
            response.content,
            {
                'success': True,
                'data': [
                    {
                        'id': 'txn-2',
                        'debt_id': 45,
                        'tenant_id': 'empresa-1',
                        'service_id': 'svc-9',
                        'customer_ref': 'C-100',
                        'amount': 50,
                        'status': 'SUCCESS',
                        'created_at': '2026-06-22T10:30:00+00:00',
                        'receipt_hash': 'rh-2',
                    }
                ],
            },
        )
        execute_mock.assert_called_once_with(
            {
                'tenant_id': 'empresa-1',
                'service_id': 'svc-9',
                'status': 'SUCCESS',
                'customer_ref': 'C-100',
                'from': '2026-06-01T00:00:00+00:00',
                'to': '2026-06-22T23:59:59+00:00',
            },
            scope={'tenant_id': 'empresa-1', 'global_role': 'admin'},
        )

    @patch('payments.api.views.ListTransactionsQueryHandler.execute')
    @patch('payments.api.views._get_request_scope')
    def test_alias_route_preserves_company_scope_for_non_admin(self, scope_mock, execute_mock):
        scope_mock.return_value = {
            'tenant_id': 'empresa-7',
            'global_role': 'provider',
        }
        execute_mock.return_value = []

        response = self.client.get(
            '/api/payments/admin/transactions',
            {
                'tenant_id': 'empresa-99',
                'status': 'PENDING',
            },
            HTTP_AUTHORIZATION='Bearer token-prueba',
            HTTP_X_COMPANY_ID='empresa-7',
        )

        self.assertEqual(response.status_code, 200)
        execute_mock.assert_called_once_with(
            {
                'tenant_id': 'empresa-7',
                'status': 'PENDING',
            },
            scope={'tenant_id': 'empresa-7', 'global_role': 'provider'},
        )

    @patch('payments.api.views.CustomJWTAuthentication.authenticate')
    def test_scope_uses_validated_session_attrs_instead_of_payload_or_header(self, authenticate_mock):
        from payments.api.views import _get_request_scope

        factory = APIRequestFactory()
        request = factory.get(
            '/api/payments',
            {'tenant_id': 'empresa-query'},
            HTTP_AUTHORIZATION='Bearer token-prueba',
            HTTP_X_COMPANY_ID='empresa-header',
        )

        def fake_authenticate(current_request):
            current_request.tenant_id = 'empresa-segura'
            current_request.role = 'provider'
            return ({'tenant_id': 'empresa-maliciosa', 'global_role': 'admin'}, 'token-prueba')

        authenticate_mock.side_effect = fake_authenticate

        scope = _get_request_scope(request)

        self.assertEqual(
            scope,
            {'tenant_id': 'empresa-segura', 'global_role': 'provider'},
        )

    @patch('payments.api.auth.requests.get')
    def test_authentication_returns_validated_session_not_unverified_token_claims(self, requests_get_mock):
        from payments.api.auth import CustomJWTAuthentication

        token = jwt.encode(
            {'tenant_id': 'empresa-maliciosa', 'global_role': 'admin'},
            key='',
            algorithm='none',
        )
        factory = APIRequestFactory()
        request = factory.get(
            '/api/payments',
            HTTP_AUTHORIZATION=f'Bearer {token}',
            HTTP_X_COMPANY_ID='empresa-header',
        )

        session = {
            'active_company_id': 'empresa-segura',
            'role': 'provider',
            'user': {
                'global_role': 'provider',
            },
        }
        response = Mock(status_code=200)
        response.json.return_value = session
        requests_get_mock.return_value = response

        authenticated_session, returned_token = CustomJWTAuthentication().authenticate(request)

        self.assertEqual(authenticated_session, session)
        self.assertEqual(returned_token, token)
        self.assertEqual(request.tenant_id, 'empresa-segura')
        self.assertEqual(request.role, 'provider')

    @patch('payments.api.views.CustomJWTAuthentication.authenticate')
    def test_list_endpoint_keeps_401_when_session_validation_fails(self, authenticate_mock):
        authenticate_mock.side_effect = AuthenticationFailed('Token inválido o expirado')

        response = self.client.get(
            '/api/payments',
            HTTP_AUTHORIZATION='Bearer token-prueba',
        )

        self.assertEqual(response.status_code, 401)
        self.assertJSONEqual(
            response.content,
            {
                'success': False,
                'message': 'Token inválido o expirado',
            },
        )


class FakeCollection:
    def __init__(self, items):
        self.items = items

    def find(self, *_args, **_kwargs):
        return list(self.items)


@override_settings(
    DATABASES={
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
        }
    }
)
class ListTransactionsQueryHandlerTests(SimpleTestCase):
    @patch(
        'payments.application.queries.transactions_collection',
        new=FakeCollection(
            [
                {
                    'id': 'txn-1',
                    'debt_id': 10,
                    'tenant_id': 'empresa-1',
                    'service_id': 'svc-9',
                    'customer_ref': 'C-100',
                    'amount': 30,
                    'status': 'PENDING',
                    'created_at': '2026-06-15T10:00:00+00:00',
                    'receipt_hash': None,
                },
                {
                    'id': 'txn-2',
                    'debt_id': 45,
                    'tenant_id': 'empresa-1',
                    'service_id': 'svc-9',
                    'customer_ref': 'C-100',
                    'amount': 50,
                    'status': 'SUCCESS',
                    'created_at': '2026-06-22T10:30:00+00:00',
                    'receipt_hash': 'rh-2',
                },
                {
                    'id': 'txn-3',
                    'tenant_id': 'empresa-2',
                    'service_id': 'svc-7',
                    'customer_ref': 'C-999',
                    'amount': 80,
                    'status': 'FAILED',
                    'created_at': '2026-06-10T08:00:00+00:00',
                },
            ]
        ),
    )
    def test_query_handler_filters_and_orders_transactions(self):
        from payments.application.queries import ListTransactionsQueryHandler

        handler = ListTransactionsQueryHandler()

        transactions = handler.execute(
            {
                'tenant_id': 'empresa-1',
                'service_id': 'svc-9',
                'customer_ref': 'C-100',
                'status': 'SUCCESS',
                'from': '2026-06-20T00:00:00+00:00',
                'to': '2026-06-23T00:00:00+00:00',
            },
            scope={'tenant_id': 'empresa-1', 'global_role': 'admin'},
        )

        self.assertEqual(
            transactions,
            [
                {
                    'id': 'txn-2',
                    'debt_id': 45,
                    'tenant_id': 'empresa-1',
                    'service_id': 'svc-9',
                    'customer_ref': 'C-100',
                    'amount': 50,
                    'status': 'SUCCESS',
                    'created_at': '2026-06-22T10:30:00+00:00',
                    'receipt_hash': 'rh-2',
                }
            ],
        )

    @patch(
        'payments.application.queries.transactions_collection',
        new=FakeCollection(
            [
                {
                    'id': 'txn-2',
                    'debt_id': 45,
                    'tenant_id': 'empresa-1',
                    'service_id': 'svc-9',
                    'customer_ref': 'C-100',
                    'amount': 50,
                    'status': 'SUCCESS',
                    'created_at': '2026-06-22T10:30:00+00:00',
                    'receipt_hash': 'rh-2',
                },
                {
                    'id': 'txn-3',
                    'tenant_id': 'empresa-2',
                    'service_id': 'svc-7',
                    'customer_ref': 'C-999',
                    'amount': 80,
                    'status': 'FAILED',
                    'created_at': '2026-06-10T08:00:00+00:00',
                },
            ]
        ),
    )
    def test_non_admin_scope_overrides_tenant_filter_and_normalizes_shape(self):
        from payments.application.queries import ListTransactionsQueryHandler

        handler = ListTransactionsQueryHandler()

        transactions = handler.execute(
            {
                'tenant_id': 'empresa-2',
            },
            scope={'tenant_id': 'empresa-1', 'global_role': 'provider'},
        )

        self.assertEqual(
            transactions,
            [
                {
                    'id': 'txn-2',
                    'debt_id': 45,
                    'tenant_id': 'empresa-1',
                    'service_id': 'svc-9',
                    'customer_ref': 'C-100',
                    'amount': 50,
                    'status': 'SUCCESS',
                    'created_at': '2026-06-22T10:30:00+00:00',
                    'receipt_hash': 'rh-2',
                }
            ],
        )
