from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from auth_tenancy.infrastructure.persistence.models import CompanyModel, MembershipModel


class AuthTenancyApiTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_model = get_user_model()

    def test_register_login_and_me_flow(self):
        register_response = self.client.post(
            "/api/auth/register/",
            {
                "username": "jesus",
                "email": "jesus@test.com",
                "password": "123456",
            },
            format="json",
        )

        self.assertEqual(register_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(register_response.data["global_role"], "user")

        login_response = self.client.post(
            "/api/auth/login/",
            {
                "email": "jesus@test.com",
                "password": "123456",
            },
            format="json",
        )

        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", login_response.data)
        self.assertIn("refresh", login_response.data)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}")
        me_response = self.client.get("/api/auth/me/")

        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertEqual(me_response.data["email"], "jesus@test.com")

    def test_provider_requires_tenant_scope_to_list_users(self):
        provider = self.user_model.objects.create_user(
            email="provider@test.com",
            username="provider",
            password="123456",
            global_role="provider",
        )
        customer = self.user_model.objects.create_user(
            email="customer@test.com",
            username="customer",
            password="123456",
            global_role="user",
        )
        outsider = self.user_model.objects.create_user(
            email="outsider@test.com",
            username="outsider",
            password="123456",
            global_role="user",
        )

        company_a = CompanyModel.objects.create(name="Aguas del Sur", nit="1001")
        company_b = CompanyModel.objects.create(name="Electro Norte", nit="1002")

        MembershipModel.objects.create(user=provider, company=company_a, company_role="provider")
        MembershipModel.objects.create(user=customer, company=company_a, company_role="operator")
        MembershipModel.objects.create(user=outsider, company=company_b, company_role="operator")

        self.client.force_authenticate(user=provider)

        forbidden_response = self.client.get("/api/auth/users/")
        self.assertEqual(forbidden_response.status_code, status.HTTP_403_FORBIDDEN)

        scoped_response = self.client.get("/api/auth/users/", HTTP_X_COMPANY_ID=str(company_a.id))
        self.assertEqual(scoped_response.status_code, status.HTTP_200_OK)

        emails = {item["email"] for item in scoped_response.data}
        self.assertIn("provider@test.com", emails)
        self.assertIn("customer@test.com", emails)
        self.assertNotIn("outsider@test.com", emails)

    def test_admin_can_create_company_and_assign_membership(self):
        admin = self.user_model.objects.create_user(
            email="admin@test.com",
            username="admin",
            password="123456",
            global_role="admin",
            is_staff=True,
        )
        provider = self.user_model.objects.create_user(
            email="provider2@test.com",
            username="provider2",
            password="123456",
            global_role="provider",
        )

        self.client.force_authenticate(user=admin)

        company_response = self.client.post(
            "/api/auth/companies/",
            {
                "name": "Cooperativa Centro",
                "nit": "2001",
                "fiscal_address": "Av. Principal 123",
                "logo_url": "https://example.com/logo.png",
            },
            format="json",
        )

        self.assertEqual(company_response.status_code, status.HTTP_201_CREATED)
        company_id = company_response.data["id"]

        membership_response = self.client.post(
            "/api/auth/memberships/",
            {
                "user_id": provider.id,
                "company_id": company_id,
                "company_role": "provider",
            },
            format="json",
        )

        self.assertEqual(membership_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(membership_response.data["company_role"], "provider")
