from __future__ import annotations

from dataclasses import dataclass

from auth_tenancy.domain.entities import User


@dataclass(slots=True)
class UserDTO:
    id: int
    username: str
    email: str
    global_role: str
    is_active: bool

    @classmethod
    def from_entity(cls, user: User) -> "UserDTO":
        return cls(
            id=user.id or 0,
            username=user.username,
            email=str(user.email),
            global_role=user.global_role.value,
            is_active=user.is_active,
        )
