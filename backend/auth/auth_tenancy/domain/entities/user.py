from __future__ import annotations

from dataclasses import dataclass

from auth_tenancy.domain.exceptions import ValidationError
from auth_tenancy.domain.value_objects import Email, GlobalRole


@dataclass(slots=True)
class User:
    username: str
    email: Email
    password_hash: str
    global_role: GlobalRole = GlobalRole.USER
    is_active: bool = True
    id: int | None = None

    def __post_init__(self) -> None:
        self.username = self.username.strip()

        if not self.username:
            raise ValidationError("Username is required")

        if not self.password_hash:
            raise ValidationError("Password hash is required")

        self.global_role = GlobalRole.from_value(self.global_role)

    def change_global_role(self, role: GlobalRole | str) -> None:
        self.global_role = GlobalRole.from_value(role)

    def activate(self) -> None:
        self.is_active = True

    def deactivate(self) -> None:
        self.is_active = False
