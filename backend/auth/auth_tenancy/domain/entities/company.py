from __future__ import annotations

from dataclasses import dataclass

from auth_tenancy.domain.exceptions import ValidationError
from auth_tenancy.domain.value_objects import CompanyStatus


@dataclass(slots=True)
class Company:
    name: str
    nit: str
    fiscal_address: str | None = None
    logo_url: str | None = None
    status: CompanyStatus = CompanyStatus.PENDING
    active: bool = True
    id: int | None = None

    def __post_init__(self) -> None:
        self.name = self.name.strip()
        self.nit = self.nit.strip()

        if not self.name:
            raise ValidationError("Company name is required")

        if not self.nit:
            raise ValidationError("Company NIT is required")

        self.status = CompanyStatus.from_value(self.status)

    def update_details(
        self,
        *,
        name: str,
        nit: str,
        fiscal_address: str | None,
        logo_url: str | None,
        active: bool,
    ) -> None:
        self.name = name.strip()
        self.nit = nit.strip()

        if not self.name:
            raise ValidationError("Company name is required")

        if not self.nit:
            raise ValidationError("Company NIT is required")

        self.fiscal_address = fiscal_address
        self.logo_url = logo_url
        self.active = active

    def change_status(self, status: CompanyStatus | str) -> None:
        self.status = CompanyStatus.from_value(status)
