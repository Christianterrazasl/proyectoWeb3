from dataclasses import dataclass


@dataclass(slots=True)
class ListUsersQuery:
    actor_id: int
    actor_role: str
    company_id: int | None = None
