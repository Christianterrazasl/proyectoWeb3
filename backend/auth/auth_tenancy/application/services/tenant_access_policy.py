from __future__ import annotations

from auth_tenancy.domain.exceptions import AuthorizationError
from auth_tenancy.domain.repositories import MembershipRepository
from auth_tenancy.domain.value_objects import GlobalRole


class TenantAccessPolicy:
    def is_admin(self, actor_role: str) -> bool:
        return GlobalRole.from_value(actor_role) == GlobalRole.ADMIN

    def ensure_admin(self, actor_role: str) -> None:
        if not self.is_admin(actor_role):
            raise AuthorizationError("Only admins can perform this action")

    def require_company_context(self, company_id: int | None) -> int:
        if company_id is None:
            raise AuthorizationError("X-Company-Id or company_id is required for tenant-scoped access")
        return company_id

    def ensure_company_access(
        self,
        *,
        actor_id: int,
        actor_role: str,
        company_id: int,
        membership_repository: MembershipRepository,
    ) -> None:
        if self.is_admin(actor_role):
            return

        membership = membership_repository.get_active_by_user_and_company(actor_id, company_id)

        if membership is None:
            raise AuthorizationError("You do not have access to this tenant")
