from rest_framework.permissions import IsAuthenticated

from auth_tenancy.application.commands import ChangeUserGlobalRoleCommand
from auth_tenancy.application.queries import GetUserDetailQuery, ListUsersQuery
from auth_tenancy.infrastructure.tenancy import TenantResolver
from auth_tenancy.interfaces.api.dependencies import (
    get_change_user_global_role_handler,
    get_list_users_handler,
    get_user_detail_handler,
)
from auth_tenancy.interfaces.api.permissions import IsAdmin
from auth_tenancy.interfaces.api.serializers import UpdateUserGlobalRoleSerializer
from auth_tenancy.interfaces.api.views.base import BaseApiView


class UserListView(BaseApiView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        handler = get_list_users_handler()
        company_id = TenantResolver.resolve_company_id(request)

        try:
            result = handler.handle(
                ListUsersQuery(
                    actor_id=request.user.id,
                    actor_role=request.user.global_role,
                    company_id=company_id,
                )
            )
            return self.success_response(result)
        except Exception as error:
            return self.handle_domain_exception(error)


class UserDetailView(BaseApiView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id: int):
        handler = get_user_detail_handler()
        company_id = TenantResolver.resolve_company_id(request)

        try:
            result = handler.handle(
                GetUserDetailQuery(
                    actor_id=request.user.id,
                    actor_role=request.user.global_role,
                    target_user_id=user_id,
                    company_id=company_id,
                )
            )
            return self.success_response(result)
        except Exception as error:
            return self.handle_domain_exception(error)


class UserGlobalRoleView(BaseApiView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, user_id: int):
        serializer = UpdateUserGlobalRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        handler = get_change_user_global_role_handler()

        try:
            result = handler.handle(
                ChangeUserGlobalRoleCommand(
                    actor_id=request.user.id,
                    actor_role=request.user.global_role,
                    target_user_id=user_id,
                    global_role=serializer.validated_data["global_role"],
                )
            )
            return self.success_response(result)
        except Exception as error:
            return self.handle_domain_exception(error)
