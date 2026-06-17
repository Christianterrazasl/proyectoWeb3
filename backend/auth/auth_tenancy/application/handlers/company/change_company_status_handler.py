from __future__ import annotations

from auth_tenancy.application.commands import ChangeCompanyStatusCommand
from auth_tenancy.application.dto import CompanyDTO
from auth_tenancy.application.services import TenantAccessPolicy
from auth_tenancy.domain.exceptions import NotFoundError
from auth_tenancy.domain.repositories import CompanyRepository


class ChangeCompanyStatusHandler:
    def __init__(
        self,
        company_repository: CompanyRepository,
        access_policy: TenantAccessPolicy,
    ):
        self.company_repository = company_repository
        self.access_policy = access_policy

    def handle(self, command: ChangeCompanyStatusCommand) -> CompanyDTO:
        self.access_policy.ensure_admin(command.actor_role)

        company = self.company_repository.get_by_id(command.company_id)

        if company is None:
            raise NotFoundError("Company not found")

        company.change_status(command.status)
        updated_company = self.company_repository.update(company)
        return CompanyDTO.from_entity(updated_company)
