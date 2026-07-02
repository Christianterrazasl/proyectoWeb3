from __future__ import annotations

from rest_framework_simplejwt.tokens import RefreshToken

from auth_tenancy.application.commands.auth.login_user import LoginUserCommand
from auth_tenancy.domain.exceptions import AuthenticationError
from auth_tenancy.domain.repositories import UserRepository
from auth_tenancy.infrastructure.persistence.models import UserModel


class LoginUserHandler:
    def __init__(self, user_repository: UserRepository, password_hasher):
        self.user_repository = user_repository
        self.password_hasher = password_hasher

    def handle(self, command: LoginUserCommand) -> dict[str, str]:
        user = self.user_repository.get_by_email(command.email.strip())

        if user is None or not self.password_hasher.verify(
            command.password,
            user.password_hash,
        ):
            raise AuthenticationError("Invalid email or password")

        user_model = UserModel.objects.get(id=user.id)
        refresh = RefreshToken.for_user(user_model)

        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }
