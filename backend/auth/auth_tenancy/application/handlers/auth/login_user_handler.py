from ....application.commands.auth.login_user import LoginUserCommand
from ....application.dto.auth_dto import LoginResultDTO, UserDTO
from ....domain.exceptions import AuthenticationError
from ....infrastructure.persistence.models.user_model import UserModel
from ....infrastructure.persistence.models.user_company_model import UserCompanyModel
from ....infrastructure.security.password_hasher import PasswordHasher
from ....infrastructure.security.jwt_service import JWTService

class LoginUserHandler:
    def handle(self, command: LoginUserCommand) -> LoginResultDTO:
        try:
            user_model = UserModel.objects.get(email=command.email)
            hasher = PasswordHasher()

            if not hasher.verify(command.password, user_model.password):
                raise AuthenticationError("Credenciales inválidas")

            tenant_id = None
            if user_model.role == 'COMPANY_ADMIN':
                user_company = UserCompanyModel.objects.filter(user=user_model).first()
                if user_company:
                    tenant_id = str(user_company.company.id)

            jwt_service = JWTService()
            token = jwt_service.generate_token(user_model, tenant_id)

            user_dto = UserDTO(
                id=str(user_model.id),
                email=user_model.email,
                global_role=user_model.role,
                tenant_id=tenant_id
            )

            return LoginResultDTO(token=token, user=user_dto)

        except UserModel.DoesNotExist:
            raise AuthenticationError("Credenciales inválidas")
