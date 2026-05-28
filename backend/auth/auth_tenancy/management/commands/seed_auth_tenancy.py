from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from auth_tenancy.infrastructure.persistence.models import CompanyModel, MembershipModel


class Command(BaseCommand):
    help = "Creates demo users, companies and memberships for the auth & tenancy module."

    def handle(self, *args, **options):
        user_model = get_user_model()

        admin, _ = user_model.objects.get_or_create(
            email="admin@multipagos.dev",
            defaults={
                "username": "admin",
                "global_role": "admin",
                "is_staff": True,
            },
        )
        admin.set_password("admin123")
        admin.save()

        provider, _ = user_model.objects.get_or_create(
            email="provider@multipagos.dev",
            defaults={
                "username": "provider",
                "global_role": "provider",
            },
        )
        provider.set_password("provider123")
        provider.save()

        customer, _ = user_model.objects.get_or_create(
            email="user@multipagos.dev",
            defaults={
                "username": "user",
                "global_role": "user",
            },
        )
        customer.set_password("user12345")
        customer.save()

        water_company, _ = CompanyModel.objects.get_or_create(
            nit="900001",
            defaults={
                "name": "Cooperativa de Agua",
                "fiscal_address": "Av. Agua 100",
                "status": "APPROVED",
            },
        )
        energy_company, _ = CompanyModel.objects.get_or_create(
            nit="900002",
            defaults={
                "name": "Empresa Eléctrica",
                "fiscal_address": "Av. Energía 200",
                "status": "APPROVED",
            },
        )

        MembershipModel.objects.get_or_create(
            user=provider,
            company=water_company,
            defaults={"company_role": "provider", "active": True},
        )
        MembershipModel.objects.get_or_create(
            user=customer,
            company=water_company,
            defaults={"company_role": "operator", "active": True},
        )
        MembershipModel.objects.get_or_create(
            user=provider,
            company=energy_company,
            defaults={"company_role": "manager", "active": True},
        )

        self.stdout.write(self.style.SUCCESS("Demo auth & tenancy data created successfully."))
