from __future__ import annotations

from auth_tenancy.application.dto import UserDTO
from auth_tenancy.application.queries import ListUsersQuery
from auth_tenancy.application.services import TenantAccessPolicy
from auth_tenancy.domain.repositories import MembershipRepository, UserRepository


class ListUsersHandler:
    def __init__(
        self,
        user_repository: UserRepository,
        membership_repository: MembershipRepository,
        access_policy: TenantAccessPolicy,
    ):
        self.user_repository = user_repository
        self.membership_repository = membership_repository
        self.access_policy = access_policy

    def handle(self, query: ListUsersQuery) -> list[UserDTO]:
        if self.access_policy.is_admin(query.actor_role):
            users = (
                self.user_repository.list_by_company(query.company_id)
                if query.company_id is not None
                else self.user_repository.list_all()
            )
        else:
            company_id = self.access_policy.require_company_context(query.company_id)
            self.access_policy.ensure_company_access(
                actor_id=query.actor_id,
                actor_role=query.actor_role,
                company_id=company_id,
                membership_repository=self.membership_repository,
            )
            users = self.user_repository.list_by_company(company_id)

        return [UserDTO.from_entity(user) for user in users]
