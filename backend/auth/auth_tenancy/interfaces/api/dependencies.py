from auth_tenancy.application.handlers import (
    AssignMembershipHandler,
    ChangeCompanyStatusHandler,
    ChangeUserGlobalRoleHandler,
    CreateCompanyHandler,
    DeleteCompanyHandler,
    GetCompanyDetailHandler,
    GetCurrentUserHandler,
    GetUserDetailHandler,
    ListCompaniesHandler,
    ListMembershipsHandler,
    ListUsersHandler,
    LoginUserHandler,
    RegisterUserHandler,
    UpdateCompanyHandler,
    UpdateMembershipHandler,
)
from auth_tenancy.application.services import TenantAccessPolicy
from auth_tenancy.infrastructure.persistence.repositories import (
    DjangoCompanyRepository,
    DjangoMembershipRepository,
    DjangoUserRepository,
)
from auth_tenancy.infrastructure.security.jwt_service import JWTService
from auth_tenancy.infrastructure.security.password_hasher import PasswordHasher


def get_register_user_handler() -> RegisterUserHandler:
    return RegisterUserHandler(DjangoUserRepository(), PasswordHasher())


def get_login_user_handler() -> LoginUserHandler:
    return LoginUserHandler(DjangoUserRepository(), PasswordHasher())


def get_current_user_handler() -> GetCurrentUserHandler:
    return GetCurrentUserHandler(DjangoUserRepository(), DjangoMembershipRepository(), DjangoCompanyRepository())


def get_list_users_handler() -> ListUsersHandler:
    return ListUsersHandler(DjangoUserRepository(), DjangoMembershipRepository(), TenantAccessPolicy())


def get_user_detail_handler() -> GetUserDetailHandler:
    return GetUserDetailHandler(DjangoUserRepository(), DjangoMembershipRepository(), TenantAccessPolicy())


def get_change_user_global_role_handler() -> ChangeUserGlobalRoleHandler:
    return ChangeUserGlobalRoleHandler(DjangoUserRepository(), TenantAccessPolicy())


def get_create_company_handler() -> CreateCompanyHandler:
    return CreateCompanyHandler(DjangoCompanyRepository(), TenantAccessPolicy())


def get_update_company_handler() -> UpdateCompanyHandler:
    return UpdateCompanyHandler(DjangoCompanyRepository(), TenantAccessPolicy())


def get_change_company_status_handler() -> ChangeCompanyStatusHandler:
    return ChangeCompanyStatusHandler(DjangoCompanyRepository(), TenantAccessPolicy())


def get_delete_company_handler() -> DeleteCompanyHandler:
    return DeleteCompanyHandler(DjangoCompanyRepository(), TenantAccessPolicy())


def get_list_companies_handler() -> ListCompaniesHandler:
    return ListCompaniesHandler(DjangoCompanyRepository(), DjangoMembershipRepository(), TenantAccessPolicy())


def get_company_detail_handler() -> GetCompanyDetailHandler:
    return GetCompanyDetailHandler(DjangoCompanyRepository(), DjangoMembershipRepository(), TenantAccessPolicy())


def get_assign_membership_handler() -> AssignMembershipHandler:
    return AssignMembershipHandler(
        DjangoMembershipRepository(),
        DjangoUserRepository(),
        DjangoCompanyRepository(),
        TenantAccessPolicy(),
    )


def get_update_membership_handler() -> UpdateMembershipHandler:
    return UpdateMembershipHandler(DjangoMembershipRepository(), TenantAccessPolicy())


def get_list_memberships_handler() -> ListMembershipsHandler:
    return ListMembershipsHandler(DjangoMembershipRepository(), TenantAccessPolicy())
