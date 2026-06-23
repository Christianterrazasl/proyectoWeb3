import os
import requests
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

AUTH_ME_URL = os.getenv("AUTH_ME_URL", "http://auth:3000/api/auth/me/")

class CustomJWTAuthentication(BaseAuthentication):
    """
    Valida la sesión contra auth y expone los claims mínimos que `pagos`
    necesita para acotar listados administrativos por empresa/rol.
    """

    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")

        if not auth_header or not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ", 1)[1]
        company_id = request.headers.get("X-Company-Id")

        headers = {
            "Authorization": auth_header,
        }

        if company_id:
            headers["X-Company-Id"] = company_id

        try:
            # `pagos` ya no confía en claims locales: delega la sesión vigente al
            # servicio de auth para respetar empresa activa y expiración real.
            response = requests.get(AUTH_ME_URL, headers=headers, timeout=5)
        except requests.RequestException:
            raise AuthenticationFailed("No se pudo validar la sesión contra auth.")

        if response.status_code != 200:
            try:
                body = response.json()
            except ValueError:
                body = {}

            raise AuthenticationFailed(
                body.get("detail") or "Token inválido o expirado"
            )

        try:
            session = response.json()
        except ValueError:
            raise AuthenticationFailed("Auth respondió con un formato inválido.")

        user = session.get("user") or {}

        request.auth_context = session
        # Conservamos estos aliases en request porque las vistas nuevas usan
        # `tenant_id`/`role`, pero parte del código histórico espera el payload completo.
        request.tenant_id = (
            session.get("active_company_id")
            or session.get("company_id")
            or user.get("active_company_id")
            or user.get("company_id")
        )
        request.role = user.get("global_role") or session.get("global_role") or session.get("role")

        return (session, token)
