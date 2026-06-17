from dataclasses import dataclass


@dataclass(slots=True)
class AssignMembershipCommand:
    actor_id: int
    actor_role: str
    user_id: int
    company_id: int
    company_role: str
