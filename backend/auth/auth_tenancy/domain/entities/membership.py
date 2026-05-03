from __future__ import annotations

from dataclasses import dataclass

from auth_tenancy.domain.exceptions import ValidationError
from auth_tenancy.domain.value_objects import CompanyRole


@dataclass(slots=True)
class Membership:
    user_id: int
    company_id: int
    company_role: CompanyRole = CompanyRole.PROVIDER
    active: bool = True
    id: int | None = None

    def __post_init__(self) -> None:
        if self.user_id <= 0:
            raise ValidationError("User ID is required")

        if self.company_id <= 0:
            raise ValidationError("Company ID is required")

        self.company_role = CompanyRole.from_value(self.company_role)

    def change_role(self, role: CompanyRole | str) -> None:
        self.company_role = CompanyRole.from_value(role)

    def activate(self) -> None:
        self.active = True

    def deactivate(self) -> None:
        self.active = False
