from dataclasses import dataclass


@dataclass(slots=True)
class GetCurrentUserQuery:
    user_id: int
    active_company_id: int | None = None
