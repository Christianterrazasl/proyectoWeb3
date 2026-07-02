from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from auth_tenancy.infrastructure.persistence.models import CompanyModel, MembershipModel


DEMO_COMPANIES = [
    {"id": 1, "name": "Nur", "nit": "NIT-NUR-001"},
    {"id": 2, "name": "Saguapac", "nit": "NIT-SAG-002"},
    {"id": 3, "name": "Cre", "nit": "NIT-CRE-003"},
    {"id": 4, "name": "Colegio Marista", "nit": "NIT-MAR-004"},
    {"id": 6, "name": "Tigo", "nit": "NIT-TIGO-006"},
]


class Command(BaseCommand):
    help = "Creates demo users, companies and memberships aligned with catalog/deudas tenant IDs."

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

        for company_data in DEMO_COMPANIES:
            CompanyModel.objects.update_or_create(
                id=company_data["id"],
                defaults={
                    "name": company_data["name"],
                    "nit": company_data["nit"],
                    "fiscal_address": f"Sede {company_data['name']}",
                    "status": "APPROVED",
                    "active": True,
                    "is_public": True,
                },
            )

        nur = CompanyModel.objects.get(id=1)

        MembershipModel.objects.get_or_create(
            user=provider,
            company=nur,
            defaults={"company_role": "provider", "active": True},
        )

        self.stdout.write(self.style.SUCCESS("Demo auth & tenancy data created successfully."))
