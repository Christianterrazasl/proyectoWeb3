from dataclasses import dataclass


@dataclass(slots=True)
class ListMembershipsQuery:
    actor_id: int
    actor_role: str
    company_id: int | None = None
