from __future__ import annotations

from dataclasses import dataclass

from auth_tenancy.domain.entities import Company, Membership, User


@dataclass(slots=True)
class UserDTO:
    id: int
    username: str
    email: str
    global_role: str
    is_active: bool

    @classmethod
    def from_entity(cls, user: User) -> "UserDTO":
        return cls(
            id=user.id or 0,
            username=user.username,
            email=str(user.email),
            global_role=user.global_role.value,
            is_active=user.is_active,
        )


@dataclass(slots=True)
class UserMembershipDTO:
    id: int
    company_id: int
    company_role: str
    active: bool

    @classmethod
    def from_entity(cls, membership: Membership) -> "UserMembershipDTO":
        return cls(
            id=membership.id or 0,
            company_id=membership.company_id,
            company_role=membership.company_role.value,
            active=membership.active,
        )


@dataclass(slots=True)
class AccessibleCompanyDTO:
    id: int
    name: str
    nit: str
    status: str
    active: bool
    logo_url: str | None
    membership_role: str

    @classmethod
    def from_entity(cls, company: Company, *, membership_role: str) -> "AccessibleCompanyDTO":
        return cls(
            id=company.id or 0,
            name=company.name,
            nit=company.nit,
            status=company.status.value,
            active=company.active,
            logo_url=company.logo_url,
            membership_role=membership_role,
        )


@dataclass(slots=True)
class CurrentUserDTO:
    user: UserDTO
    memberships: list[UserMembershipDTO]
    accessible_companies: list[AccessibleCompanyDTO]
    active_company_id: int | None
