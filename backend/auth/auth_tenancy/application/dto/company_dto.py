from __future__ import annotations

from dataclasses import dataclass

from auth_tenancy.domain.entities import Company


@dataclass(slots=True)
class CompanyDTO:
    id: int
    name: str
    nit: str
    fiscal_address: str | None
    logo_url: str | None
    status: str
    active: bool

    @classmethod
    def from_entity(cls, company: Company) -> "CompanyDTO":
        return cls(
            id=company.id or 0,
            name=company.name,
            nit=company.nit,
            fiscal_address=company.fiscal_address,
            logo_url=company.logo_url,
            status=company.status.value,
            active=company.active,
        )
