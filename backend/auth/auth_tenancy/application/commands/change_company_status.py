from dataclasses import dataclass


@dataclass(slots=True)
class ChangeCompanyStatusCommand:
    actor_id: int
    actor_role: str
    company_id: int
    status: str
