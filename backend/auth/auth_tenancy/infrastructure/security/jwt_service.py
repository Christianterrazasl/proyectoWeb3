import jwt
from datetime import datetime, timedelta
from django.conf import settings

class JWTService:
    def generate_token(self, user, tenant_id=None):
        role_str = getattr(user, 'role', None) or getattr(user, 'global_role', None)
        if hasattr(role_str, 'value'):
            role_str = role_str.value

        email_str = getattr(user, 'email', '')
        if hasattr(email_str, 'value'):
            email_str = email_str.value

        payload = {
            'user_id': str(user.id),
            'email': str(email_str),
            'global_role': str(role_str),
            'tenant_id': str(tenant_id) if tenant_id else None,
            'exp': datetime.utcnow() + timedelta(hours=24),
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

    def decode_token(self, token):
        try:
            return jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise ValueError("Token_Expired")
        except jwt.InvalidTokenError:
            raise ValueError("Token_Invalid")
