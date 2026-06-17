from __future__ import annotations

from auth_tenancy.application.commands import ChangeUserGlobalRoleCommand
from auth_tenancy.application.dto import UserDTO
from auth_tenancy.application.services import TenantAccessPolicy
from auth_tenancy.domain.exceptions import NotFoundError
from auth_tenancy.domain.repositories import UserRepository


class ChangeUserGlobalRoleHandler:
    def __init__(
        self,
        user_repository: UserRepository,
        access_policy: TenantAccessPolicy,
    ):
        self.user_repository = user_repository
        self.access_policy = access_policy

    def handle(self, command: ChangeUserGlobalRoleCommand) -> UserDTO:
        self.access_policy.ensure_admin(command.actor_role)

        user = self.user_repository.get_by_id(command.target_user_id)

        if user is None:
            raise NotFoundError("User not found")

        user.change_global_role(command.global_role)
        updated_user = self.user_repository.update(user)
        return UserDTO.from_entity(updated_user)
