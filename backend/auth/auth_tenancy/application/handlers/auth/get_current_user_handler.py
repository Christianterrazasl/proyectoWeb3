from __future__ import annotations

from auth_tenancy.application.dto import AccessibleCompanyDTO, CurrentUserDTO, UserDTO, UserMembershipDTO
from auth_tenancy.application.queries import GetCurrentUserQuery
from auth_tenancy.application.services import TenantAccessPolicy
from auth_tenancy.domain.exceptions import AuthorizationError, NotFoundError
from auth_tenancy.domain.repositories import CompanyRepository, MembershipRepository, UserRepository


class GetCurrentUserHandler:
    def __init__(
        self,
        user_repository: UserRepository,
        membership_repository: MembershipRepository,
        company_repository: CompanyRepository,
        access_policy: TenantAccessPolicy | None = None,
    ):
        self.user_repository = user_repository
        self.membership_repository = membership_repository
        self.company_repository = company_repository
        self.access_policy = access_policy or TenantAccessPolicy()

    def handle(self, query: GetCurrentUserQuery) -> CurrentUserDTO:
        user = self.user_repository.get_by_id(query.user_id)

        if user is None:
            raise NotFoundError("User not found")

        memberships = self.membership_repository.list_active_by_user(query.user_id)
        global_role = user.global_role.value
        is_admin = self.access_policy.is_admin(global_role)

        if is_admin:
            companies = self.company_repository.list_all()
            company_ids = [company.id for company in companies if company.id is not None]

            if (
                query.active_company_id is not None
                and query.active_company_id not in company_ids
            ):
                raise AuthorizationError("You do not have access to this tenant")

            accessible_companies = [
                AccessibleCompanyDTO.from_entity(company, membership_role="admin")
                for company in companies
                if company.id is not None
            ]

            active_company_id = (
                query.active_company_id
                if query.active_company_id is not None
                else (company_ids[0] if company_ids else None)
            )

            return CurrentUserDTO(
                user=UserDTO.from_entity(user),
                memberships=[UserMembershipDTO.from_entity(membership) for membership in memberships],
                accessible_companies=accessible_companies,
                active_company_id=active_company_id,
            )

        company_ids = [membership.company_id for membership in memberships]

        if query.active_company_id is not None and query.active_company_id not in company_ids:
            raise AuthorizationError("You do not have access to this tenant")

        companies_by_id = {
            company.id: company
            for company in self.company_repository.list_by_ids(company_ids)
            if company.id is not None
        }

        accessible_companies = [
            AccessibleCompanyDTO.from_entity(
                companies_by_id[membership.company_id],
                membership_role=membership.company_role.value,
            )
            for membership in memberships
            if membership.company_id in companies_by_id
        ]

        return CurrentUserDTO(
            user=UserDTO.from_entity(user),
            memberships=[UserMembershipDTO.from_entity(membership) for membership in memberships],
            accessible_companies=accessible_companies,
            active_company_id=(
                query.active_company_id
                if query.active_company_id is not None
                else (company_ids[0] if company_ids else None)
            ),
        )
