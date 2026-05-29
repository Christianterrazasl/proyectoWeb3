from __future__ import annotations

from auth_tenancy.application.commands import LoginUserCommand
from auth_tenancy.application.dto import LoginResultDTO, UserDTO
from auth_tenancy.domain.exceptions import AuthenticationError
from auth_tenancy.domain.repositories import UserRepository


class LoginUserHandler:
    def __init__(self, user_repository: UserRepository, password_hasher, jwt_service):
        self.user_repository = user_repository
        self.password_hasher = password_hasher
        self.jwt_service = jwt_service

    def handle(self, command: LoginUserCommand) -> LoginResultDTO:
        user = self.user_repository.get_by_email(command.email.strip().lower())

        if user is None:
            raise AuthenticationError("Invalid email or password")

        if not user.is_active:
            raise AuthenticationError("User is inactive")

        if not self.password_hasher.verify(command.password, user.password_hash):
            raise AuthenticationError("Invalid email or password")

        tokens = self.jwt_service.issue_tokens(user)
        return LoginResultDTO(
            refresh=tokens["refresh"],
            access=tokens["access"],
            user=UserDTO.from_entity(user),
        )
