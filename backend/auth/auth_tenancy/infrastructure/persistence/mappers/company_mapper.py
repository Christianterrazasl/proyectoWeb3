from __future__ import annotations

from auth_tenancy.domain.entities import Company
from auth_tenancy.domain.value_objects import CompanyStatus


class CompanyMapper:
    @staticmethod
    def to_domain(model) -> Company:
        return Company(
            id=model.id,
            name=model.name,
            nit=model.nit,
            fiscal_address=model.fiscal_address,
            logo_url=model.logo_url,
            status=CompanyStatus.from_value(model.status),
            active=model.active,
        )
