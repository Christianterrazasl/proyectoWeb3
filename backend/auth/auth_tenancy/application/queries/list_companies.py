from dataclasses import dataclass


@dataclass(slots=True)
class ListCompaniesQuery:
    actor_id: int
    actor_role: str
