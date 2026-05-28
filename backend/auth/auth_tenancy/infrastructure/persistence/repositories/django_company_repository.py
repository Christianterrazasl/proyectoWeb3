from __future__ import annotations

from auth_tenancy.domain.entities import Company
from auth_tenancy.domain.repositories import CompanyRepository
from auth_tenancy.infrastructure.persistence.mappers import CompanyMapper
from auth_tenancy.infrastructure.persistence.models import CompanyModel


class DjangoCompanyRepository(CompanyRepository):
    def exists_by_nit(self, nit: str, exclude_company_id: int | None = None) -> bool:
        queryset = CompanyModel.objects.filter(nit=nit)

        if exclude_company_id is not None:
            queryset = queryset.exclude(id=exclude_company_id)

        return queryset.exists()

    def get_by_id(self, company_id: int) -> Company | None:
        model = CompanyModel.objects.filter(id=company_id).first()
        return CompanyMapper.to_domain(model) if model else None

    def list_all(self) -> list[Company]:
        return [CompanyMapper.to_domain(model) for model in CompanyModel.objects.all()]

    def list_by_ids(self, company_ids: list[int]) -> list[Company]:
        if not company_ids:
            return []

        queryset = CompanyModel.objects.filter(id__in=company_ids)
        return [CompanyMapper.to_domain(model) for model in queryset]

    def save(self, company: Company) -> Company:
        model = CompanyModel.objects.create(
            name=company.name,
            nit=company.nit,
            fiscal_address=company.fiscal_address,
            logo_url=company.logo_url,
            status=company.status.value,
            active=company.active,
        )
        return CompanyMapper.to_domain(model)

    def update(self, company: Company) -> Company:
        model = CompanyModel.objects.get(id=company.id)
        model.name = company.name
        model.nit = company.nit
        model.fiscal_address = company.fiscal_address
        model.logo_url = company.logo_url
        model.status = company.status.value
        model.active = company.active
        model.save(update_fields=["name", "nit", "fiscal_address", "logo_url", "status", "active", "updated_at"])
        return CompanyMapper.to_domain(model)
