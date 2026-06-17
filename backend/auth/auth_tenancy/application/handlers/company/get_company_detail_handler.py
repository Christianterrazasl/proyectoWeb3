from __future__ import annotations

from auth_tenancy.application.dto import CompanyDTO
from auth_tenancy.application.queries import GetCompanyDetailQuery
from auth_tenancy.application.services import TenantAccessPolicy
from auth_tenancy.domain.exceptions import NotFoundError
from auth_tenancy.domain.repositories import CompanyRepository, MembershipRepository


class GetCompanyDetailHandler:
    def __init__(
        self,
        company_repository: CompanyRepository,
        membership_repository: MembershipRepository,
        access_policy: TenantAccessPolicy,
    ):
        self.company_repository = company_repository
        self.membership_repository = membership_repository
        self.access_policy = access_policy

    def handle(self, query: GetCompanyDetailQuery) -> CompanyDTO:
        if not self.access_policy.is_admin(query.actor_role):
            self.access_policy.ensure_company_access(
                actor_id=query.actor_id,
                actor_role=query.actor_role,
                company_id=query.company_id,
                membership_repository=self.membership_repository,
            )

        company = self.company_repository.get_by_id(query.company_id)

        if company is None:
            raise NotFoundError("Company not found")

        return CompanyDTO.from_entity(company)
