from __future__ import annotations

from auth_tenancy.application.commands import UpdateCompanyCommand
from auth_tenancy.application.dto import CompanyDTO
from auth_tenancy.application.services import TenantAccessPolicy
from auth_tenancy.domain.exceptions import ConflictError, NotFoundError
from auth_tenancy.domain.repositories import CompanyRepository


class UpdateCompanyHandler:
    def __init__(
        self,
        company_repository: CompanyRepository,
        access_policy: TenantAccessPolicy,
    ):
        self.company_repository = company_repository
        self.access_policy = access_policy

    def handle(self, command: UpdateCompanyCommand) -> CompanyDTO:
        self.access_policy.ensure_admin(command.actor_role)

        company = self.company_repository.get_by_id(command.company_id)

        if company is None:
            raise NotFoundError("Company not found")

        if self.company_repository.exists_by_nit(command.nit, exclude_company_id=command.company_id):
            raise ConflictError("A company with this NIT already exists")

        company.update_details(
            name=command.name,
            nit=command.nit,
            fiscal_address=command.fiscal_address,
            logo_url=command.logo_url,
            active=command.active,
        )
        updated_company = self.company_repository.update(company)
        return CompanyDTO.from_entity(updated_company)
