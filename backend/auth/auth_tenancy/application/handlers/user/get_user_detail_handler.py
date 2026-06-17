from __future__ import annotations

from auth_tenancy.application.dto import UserDTO
from auth_tenancy.application.queries import GetUserDetailQuery
from auth_tenancy.application.services import TenantAccessPolicy
from auth_tenancy.domain.exceptions import NotFoundError
from auth_tenancy.domain.repositories import MembershipRepository, UserRepository


class GetUserDetailHandler:
    def __init__(
        self,
        user_repository: UserRepository,
        membership_repository: MembershipRepository,
        access_policy: TenantAccessPolicy,
    ):
        self.user_repository = user_repository
        self.membership_repository = membership_repository
        self.access_policy = access_policy

    def handle(self, query: GetUserDetailQuery) -> UserDTO:
        if not self.access_policy.is_admin(query.actor_role):
            company_id = self.access_policy.require_company_context(query.company_id)
            self.access_policy.ensure_company_access(
                actor_id=query.actor_id,
                actor_role=query.actor_role,
                company_id=company_id,
                membership_repository=self.membership_repository,
            )
            company_users = self.user_repository.list_by_company(company_id)

            if not any(user.id == query.target_user_id for user in company_users):
                raise NotFoundError("User not found in tenant scope")

        user = self.user_repository.get_by_id(query.target_user_id)

        if user is None:
            raise NotFoundError("User not found")

        return UserDTO.from_entity(user)
