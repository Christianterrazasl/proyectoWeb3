from rest_framework.permissions import IsAuthenticated

from auth_tenancy.application.commands import LoginUserCommand, RegisterUserCommand
from auth_tenancy.application.queries import GetCurrentUserQuery
from auth_tenancy.interfaces.api.dependencies import (
    get_current_user_handler,
    get_login_user_handler,
    get_register_user_handler,
)
from auth_tenancy.interfaces.api.serializers import LoginUserSerializer, RegisterUserSerializer
from auth_tenancy.interfaces.api.views.base import BaseApiView


class RegisterUserView(BaseApiView):
    def post(self, request):
        serializer = RegisterUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        command = RegisterUserCommand(
            username=serializer.validated_data["username"],
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )

        handler = get_register_user_handler()

        try:
            result = handler.handle(command)
            return self.success_response(result, status_code=201)
        except Exception as error:
            return self.handle_domain_exception(error)


class LoginUserView(BaseApiView):
    def post(self, request):
        serializer = LoginUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        command = LoginUserCommand(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )

        handler = get_login_user_handler()

        try:
            result = handler.handle(command)
            return self.success_response(result)
        except Exception as error:
            return self.handle_domain_exception(error)


class MeView(BaseApiView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        handler = get_current_user_handler()

        try:
            result = handler.handle(GetCurrentUserQuery(user_id=request.user.id))
            return self.success_response(result)
        except Exception as error:
            return self.handle_domain_exception(error)
