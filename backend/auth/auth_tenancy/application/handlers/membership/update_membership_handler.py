from __future__ import annotations

from auth_tenancy.application.commands import UpdateMembershipCommand
from auth_tenancy.application.dto import MembershipDTO
from auth_tenancy.application.services import TenantAccessPolicy
from auth_tenancy.domain.exceptions import NotFoundError
from auth_tenancy.domain.repositories import MembershipRepository


class UpdateMembershipHandler:
    def __init__(
        self,
        membership_repository: MembershipRepository,
        access_policy: TenantAccessPolicy,
    ):
        self.membership_repository = membership_repository
        self.access_policy = access_policy

    def handle(self, command: UpdateMembershipCommand) -> MembershipDTO:
        self.access_policy.ensure_admin(command.actor_role)

        membership = self.membership_repository.get_by_id(command.membership_id)

        if membership is None:
            raise NotFoundError("Membership not found")

        if command.company_role is not None:
            membership.change_role(command.company_role)

        if command.active is not None:
            membership.active = command.active

        updated_membership = self.membership_repository.update(membership)
        return MembershipDTO.from_entity(updated_membership)
