from __future__ import annotations

from dataclasses import dataclass
import re

from auth_tenancy.domain.exceptions import ValidationError


EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@dataclass(frozen=True, slots=True)
class Email:
    value: str

    def __post_init__(self) -> None:
        normalized = self.value.strip().lower()

        if not normalized:
            raise ValidationError("Email is required")

        if not EMAIL_PATTERN.match(normalized):
            raise ValidationError("Invalid email format")

        object.__setattr__(self, "value", normalized)

    def __str__(self) -> str:
        return self.value
