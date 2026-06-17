from dataclasses import dataclass


@dataclass(slots=True)
class UpdateCompanyCommand:
    actor_id: int
    actor_role: str
    company_id: int
    name: str
    nit: str
    fiscal_address: str | None
    logo_url: str | None
    active: bool
