from __future__ import annotations

from auth_tenancy.domain.entities import Membership
from auth_tenancy.domain.value_objects import CompanyRole


class MembershipMapper:
    @staticmethod
    def to_domain(model) -> Membership:
        return Membership(
            id=model.id,
            user_id=model.user_id,
            company_id=model.company_id,
            company_role=CompanyRole.from_value(model.company_role),
            active=model.active,
        )
