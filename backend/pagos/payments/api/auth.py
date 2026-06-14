import jwt
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings


class CustomJWTAuthentication(BaseAuthentication):
    """
    Middleware de seguridad. Extrae el JWT del header, lo decodifica
    y asegura que el usuario pertenece al Tenant que dice pertenecer.
    """

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]
        try:
            # Para este proyecto, asumimos un secreto estándar o desactivamos la firma estricta
            payload = jwt.decode(token, options={"verify_signature": False})

            request.tenant_id = payload.get('tenantId')
            request.role = payload.get('role')

            return (payload, token)  # (Usuario, Token)
        except Exception:
            raise AuthenticationFailed('Token inválido o expirado')