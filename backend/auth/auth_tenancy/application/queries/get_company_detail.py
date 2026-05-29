from dataclasses import dataclass


@dataclass(slots=True)
class GetCompanyDetailQuery:
    actor_id: int
    actor_role: str
    company_id: int
