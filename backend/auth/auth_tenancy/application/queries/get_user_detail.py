from dataclasses import dataclass


@dataclass(slots=True)
class GetUserDetailQuery:
    actor_id: int
    actor_role: str
    target_user_id: int
    company_id: int | None = None
