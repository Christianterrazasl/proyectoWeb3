from rest_framework.permissions import IsAuthenticated

from auth_tenancy.application.commands import AssignMembershipCommand, UpdateMembershipCommand
from auth_tenancy.application.queries import ListMembershipsQuery
from auth_tenancy.infrastructure.tenancy import TenantResolver
from auth_tenancy.interfaces.api.dependencies import (
    get_assign_membership_handler,
    get_list_memberships_handler,
    get_update_membership_handler,
)
from auth_tenancy.interfaces.api.permissions import IsAdmin
from auth_tenancy.interfaces.api.serializers import AssignMembershipSerializer, UpdateMembershipSerializer
from auth_tenancy.interfaces.api.views.base import BaseApiView


class MembershipListCreateView(BaseApiView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    def get(self, request):
        handler = get_list_memberships_handler()
        company_id = TenantResolver.resolve_company_id(request)

        try:
            result = handler.handle(
                ListMembershipsQuery(
                    actor_id=request.user.id,
                    actor_role=request.user.global_role,
                    company_id=company_id,
                )
            )
            return self.success_response(result)
        except Exception as error:
            return self.handle_domain_exception(error)

    def post(self, request):
        serializer = AssignMembershipSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        handler = get_assign_membership_handler()

        try:
            result = handler.handle(
                AssignMembershipCommand(
                    actor_id=request.user.id,
                    actor_role=request.user.global_role,
                    user_id=serializer.validated_data["user_id"],
                    company_id=serializer.validated_data["company_id"],
                    company_role=serializer.validated_data["company_role"],
                )
            )
            return self.success_response(result, status_code=201)
        except Exception as error:
            return self.handle_domain_exception(error)


class MembershipDetailView(BaseApiView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, membership_id: int):
        serializer = UpdateMembershipSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        handler = get_update_membership_handler()

        try:
            result = handler.handle(
                UpdateMembershipCommand(
                    actor_id=request.user.id,
                    actor_role=request.user.global_role,
                    membership_id=membership_id,
                    company_role=serializer.validated_data.get("company_role"),
                    active=serializer.validated_data.get("active"),
                )
            )
            return self.success_response(result)
        except Exception as error:
            return self.handle_domain_exception(error)
