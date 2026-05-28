from __future__ import annotations

from auth_tenancy.domain.entities import User
from auth_tenancy.domain.value_objects import Email, GlobalRole


class UserMapper:
    @staticmethod
    def to_domain(model) -> User:
        return User(
            id=model.id,
            username=model.username,
            email=Email(model.email),
            password_hash=model.password,
            global_role=GlobalRole.from_value(model.global_role),
            is_active=model.is_active,
        )
