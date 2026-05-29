from __future__ import annotations

from enum import Enum

from auth_tenancy.domain.exceptions import ValidationError


class CompanyRole(str, Enum):
    PROVIDER = "provider"
    MANAGER = "manager"
    OPERATOR = "operator"

    @classmethod
    def from_value(cls, value: str | "CompanyRole") -> "CompanyRole":
        if isinstance(value, cls):
            return value

        try:
            return cls(str(value).strip().lower())
        except ValueError as exc:
            raise ValidationError("Invalid company role") from exc

    @classmethod
    def values(cls) -> list[str]:
        return [role.value for role in cls]
