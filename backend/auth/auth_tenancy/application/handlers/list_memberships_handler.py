from __future__ import annotations

from auth_tenancy.application.dto import MembershipDTO
from auth_tenancy.application.queries import ListMembershipsQuery
from auth_tenancy.application.services import TenantAccessPolicy
from auth_tenancy.domain.repositories import MembershipRepository


class ListMembershipsHandler:
    def __init__(
        self,
        membership_repository: MembershipRepository,
        access_policy: TenantAccessPolicy,
    ):
        self.membership_repository = membership_repository
        self.access_policy = access_policy

    def handle(self, query: ListMembershipsQuery) -> list[MembershipDTO]:
        if self.access_policy.is_admin(query.actor_role):
            memberships = (
                self.membership_repository.list_by_company(query.company_id)
                if query.company_id is not None
                else self.membership_repository.list_all()
            )
        else:
            company_id = self.access_policy.require_company_context(query.company_id)
            self.access_policy.ensure_company_access(
                actor_id=query.actor_id,
                actor_role=query.actor_role,
                company_id=company_id,
                membership_repository=self.membership_repository,
            )
            memberships = self.membership_repository.list_by_company(company_id)

        return [MembershipDTO.from_entity(membership) for membership in memberships]
