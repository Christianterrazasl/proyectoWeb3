from dataclasses import dataclass


@dataclass(slots=True)
class CreateCompanyCommand:
    actor_id: int
    actor_role: str
    name: str
    nit: str
    fiscal_address: str | None = None
    logo_url: str | None = None
    description: str | None = None
    category: str | None = None
