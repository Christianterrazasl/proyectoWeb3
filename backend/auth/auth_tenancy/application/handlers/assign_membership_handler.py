from __future__ import annotations

from auth_tenancy.application.commands import AssignMembershipCommand
from auth_tenancy.application.dto import MembershipDTO
from auth_tenancy.application.services import TenantAccessPolicy
from auth_tenancy.domain.entities import Membership
from auth_tenancy.domain.exceptions import ConflictError, NotFoundError
from auth_tenancy.domain.repositories import CompanyRepository, MembershipRepository, UserRepository


class AssignMembershipHandler:
    def __init__(
        self,
        membership_repository: MembershipRepository,
        user_repository: UserRepository,
        company_repository: CompanyRepository,
        access_policy: TenantAccessPolicy,
    ):
        self.membership_repository = membership_repository
        self.user_repository = user_repository
        self.company_repository = company_repository
        self.access_policy = access_policy

    def handle(self, command: AssignMembershipCommand) -> MembershipDTO:
        self.access_policy.ensure_admin(command.actor_role)

        if self.user_repository.get_by_id(command.user_id) is None:
            raise NotFoundError("User not found")

        if self.company_repository.get_by_id(command.company_id) is None:
            raise NotFoundError("Company not found")

        if self.membership_repository.exists(command.user_id, command.company_id):
            raise ConflictError("User is already assigned to this company")

        membership = Membership(
            user_id=command.user_id,
            company_id=command.company_id,
            company_role=command.company_role,
        )
        saved_membership = self.membership_repository.save(membership)
        return MembershipDTO.from_entity(saved_membership)
