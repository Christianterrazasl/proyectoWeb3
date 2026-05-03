from __future__ import annotations

from auth_tenancy.application.commands import RegisterUserCommand
from auth_tenancy.application.dto import UserDTO
from auth_tenancy.domain.entities import User
from auth_tenancy.domain.exceptions import ConflictError, ValidationError
from auth_tenancy.domain.repositories import UserRepository
from auth_tenancy.domain.value_objects import Email


class RegisterUserHandler:
    def __init__(self, user_repository: UserRepository, password_hasher):
        self.user_repository = user_repository
        self.password_hasher = password_hasher

    def handle(self, command: RegisterUserCommand) -> UserDTO:
        password = command.password.strip()

        if len(password) < 6:
            raise ValidationError("Password must be at least 6 characters")

        email = Email(command.email)

        if self.user_repository.exists_by_email(str(email)):
            raise ConflictError("A user with this email already exists")

        user = User(
            username=command.username,
            email=email,
            password_hash=self.password_hasher.hash(password),
        )
        saved_user = self.user_repository.save(user)
        return UserDTO.from_entity(saved_user)
