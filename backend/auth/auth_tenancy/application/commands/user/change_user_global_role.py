from dataclasses import dataclass


@dataclass(slots=True)
class ChangeUserGlobalRoleCommand:
    actor_id: int
    actor_role: str
    target_user_id: int
    global_role: str
