from __future__ import annotations

from auth_tenancy.application.commands import CreateCompanyCommand
from auth_tenancy.application.dto import CompanyDTO
from auth_tenancy.application.services import TenantAccessPolicy
from auth_tenancy.domain.entities import Company
from auth_tenancy.domain.exceptions import ConflictError
from auth_tenancy.domain.repositories import CompanyRepository


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
        )
        saved_company = self.company_repository.save(company)
        return CompanyDTO.from_entity(saved_company)
