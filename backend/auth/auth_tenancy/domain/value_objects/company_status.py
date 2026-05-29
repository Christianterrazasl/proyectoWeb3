from __future__ import annotations

from enum import Enum

from auth_tenancy.domain.exceptions import ValidationError


class CompanyStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

    @classmethod
    def from_value(cls, value: str | "CompanyStatus") -> "CompanyStatus":
        if isinstance(value, cls):
            return value

        normalized = str(value).strip().upper()

        try:
            return cls(normalized)
        except ValueError as exc:
            raise ValidationError("Invalid company status") from exc

    @classmethod
    def values(cls) -> list[str]:
        return [status.value for status in cls]
