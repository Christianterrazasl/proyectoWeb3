from dataclasses import dataclass


@dataclass(slots=True)
class DeleteCompanyCommand:
    actor_id: int
    actor_role: str
    company_id: int
