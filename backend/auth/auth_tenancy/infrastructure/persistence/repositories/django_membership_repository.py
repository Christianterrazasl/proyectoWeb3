from __future__ import annotations

from auth_tenancy.domain.entities import Membership
from auth_tenancy.domain.repositories import MembershipRepository
from auth_tenancy.infrastructure.persistence.mappers import MembershipMapper
from auth_tenancy.infrastructure.persistence.models import MembershipModel


class DjangoMembershipRepository(MembershipRepository):
    def exists(self, user_id: int, company_id: int) -> bool:
        return MembershipModel.objects.filter(user_id=user_id, company_id=company_id).exists()

    def get_by_id(self, membership_id: int) -> Membership | None:
        model = MembershipModel.objects.filter(id=membership_id).first()
        return MembershipMapper.to_domain(model) if model else None

    def get_active_by_user_and_company(self, user_id: int, company_id: int) -> Membership | None:
        model = MembershipModel.objects.filter(user_id=user_id, company_id=company_id, active=True).first()
        return MembershipMapper.to_domain(model) if model else None

    def list_all(self) -> list[Membership]:
        return [MembershipMapper.to_domain(model) for model in MembershipModel.objects.all()]

    def list_by_company(self, company_id: int) -> list[Membership]:
        queryset = MembershipModel.objects.filter(company_id=company_id)
        return [MembershipMapper.to_domain(model) for model in queryset]

    def list_by_user(self, user_id: int) -> list[Membership]:
        queryset = MembershipModel.objects.filter(user_id=user_id)
        return [MembershipMapper.to_domain(model) for model in queryset]

    def list_active_by_user(self, user_id: int) -> list[Membership]:
        queryset = MembershipModel.objects.filter(user_id=user_id, active=True)
        return [MembershipMapper.to_domain(model) for model in queryset]

    def list_company_ids_for_user(self, user_id: int) -> list[int]:
        return list(
            MembershipModel.objects.filter(user_id=user_id, active=True)
            .values_list("company_id", flat=True)
        )

    def save(self, membership: Membership) -> Membership:
        model = MembershipModel.objects.create(
            user_id=membership.user_id,
            company_id=membership.company_id,
            company_role=membership.company_role.value,
            active=membership.active,
        )
        return MembershipMapper.to_domain(model)

    def update(self, membership: Membership) -> Membership:
        model = MembershipModel.objects.get(id=membership.id)
        model.company_role = membership.company_role.value
        model.active = membership.active
        model.save(update_fields=["company_role", "active", "updated_at"])
        return MembershipMapper.to_domain(model)
