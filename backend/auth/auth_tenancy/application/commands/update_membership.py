from dataclasses import dataclass


@dataclass(slots=True)
class UpdateMembershipCommand:
    actor_id: int
    actor_role: str
    membership_id: int
    company_role: str | None = None
    active: bool | None = None
