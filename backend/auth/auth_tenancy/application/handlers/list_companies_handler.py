from __future__ import annotations

from auth_tenancy.application.dto import CompanyDTO
from auth_tenancy.application.queries import ListCompaniesQuery
from auth_tenancy.application.services import TenantAccessPolicy
from auth_tenancy.domain.repositories import CompanyRepository, MembershipRepository


class ListCompaniesHandler:
    def __init__(
        self,
        company_repository: CompanyRepository,
        membership_repository: MembershipRepository,
        access_policy: TenantAccessPolicy,
    ):
        self.company_repository = company_repository
        self.membership_repository = membership_repository
        self.access_policy = access_policy

    def handle(self, query: ListCompaniesQuery) -> list[CompanyDTO]:
        if self.access_policy.is_admin(query.actor_role):
            companies = self.company_repository.list_all()
        else:
            company_ids = self.membership_repository.list_company_ids_for_user(query.actor_id)
            companies = self.company_repository.list_by_ids(company_ids)

        return [CompanyDTO.from_entity(company) for company in companies]
