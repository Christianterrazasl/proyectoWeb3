from __future__ import annotations

from dataclasses import dataclass

from auth_tenancy.domain.entities import Membership


@dataclass(slots=True)
class MembershipDTO:
    id: int
    user_id: int
    company_id: int
    company_role: str
    active: bool

    @classmethod
    def from_entity(cls, membership: Membership) -> "MembershipDTO":
        return cls(
            id=membership.id or 0,
            user_id=membership.user_id,
            company_id=membership.company_id,
            company_role=membership.company_role.value,
            active=membership.active,
        )
