from __future__ import annotations

from auth_tenancy.application.commands import CreateCompanyCommand
from auth_tenancy.application.dto import CompanyDTO
from auth_tenancy.application.services import TenantAccessPolicy
from django.utils.text import slugify

from auth_tenancy.domain.entities import Company
from auth_tenancy.domain.exceptions import ConflictError
from auth_tenancy.domain.repositories import CompanyRepository
from auth_tenancy.domain.value_objects import CompanyStatus
from auth_tenancy.infrastructure.persistence.models import CompanyModel


class CreateCompanyHandler:
    def __init__(
        self,
        company_repository: CompanyRepository,
        access_policy: TenantAccessPolicy,
    ):
        self.company_repository = company_repository
        self.access_policy = access_policy

    def handle(self, command: CreateCompanyCommand) -> CompanyDTO:
        self.access_policy.ensure_admin(command.actor_role)

        if self.company_repository.exists_by_nit(command.nit):
            raise ConflictError("A company with this NIT already exists")

        company = Company(
            name=command.name,
            nit=command.nit,
            fiscal_address=command.fiscal_address,
            logo_url=command.logo_url,
            status=CompanyStatus.APPROVED,
            active=True,
        )
        saved_company = self.company_repository.save(company)

        CompanyModel.objects.filter(id=saved_company.id).update(
            status=CompanyStatus.APPROVED.value,
            is_public=True,
            slug=slugify(command.name) or f"empresa-{saved_company.id}",
            category=command.category or "Servicios",
            short_description=command.description
            or f"Pago de servicios de {command.name}",
        )

        published_company = self.company_repository.get_by_id(saved_company.id)
        return CompanyDTO.from_entity(published_company or saved_company)
