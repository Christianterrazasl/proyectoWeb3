from __future__ import annotations

from auth_tenancy.application.commands import DeleteCompanyCommand
from auth_tenancy.application.dto import CompanyDTO
from auth_tenancy.application.services import TenantAccessPolicy
from auth_tenancy.domain.exceptions import NotFoundError
from auth_tenancy.domain.repositories import CompanyRepository
from auth_tenancy.domain.value_objects import CompanyStatus
from auth_tenancy.infrastructure.persistence.models import CompanyModel


class DeleteCompanyHandler:
    def __init__(
        self,
        company_repository: CompanyRepository,
        access_policy: TenantAccessPolicy,
    ):
        self.company_repository = company_repository
        self.access_policy = access_policy

    def handle(self, command: DeleteCompanyCommand) -> CompanyDTO:
        self.access_policy.ensure_admin(command.actor_role)

        company = self.company_repository.get_by_id(command.company_id)

        if company is None:
            raise NotFoundError("Company not found")

        company.active = False
        company.change_status(CompanyStatus.REJECTED)
        updated_company = self.company_repository.update(company)

        CompanyModel.objects.filter(id=command.company_id).update(is_public=False)

        return CompanyDTO.from_entity(updated_company)
