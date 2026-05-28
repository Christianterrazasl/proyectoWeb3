from __future__ import annotations

from enum import Enum

from auth_tenancy.domain.exceptions import ValidationError


class GlobalRole(str, Enum):
    ADMIN = "admin"
    PROVIDER = "provider"
    USER = "user"

    @classmethod
    def from_value(cls, value: str | "GlobalRole") -> "GlobalRole":
        if isinstance(value, cls):
            return value

        try:
            return cls(str(value).strip().lower())
        except ValueError as exc:
            raise ValidationError("Invalid global role") from exc

    @classmethod
    def values(cls) -> list[str]:
        return [role.value for role in cls]
