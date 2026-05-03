from django.contrib.auth import get_user_model
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication


class CustomJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user_id = validated_token.get("user_id")

        if user_id is None:
            raise AuthenticationFailed("Token is invalid")

        user_model = get_user_model()

        try:
            return user_model.objects.get(id=user_id, is_active=True)
        except user_model.DoesNotExist as exc:
            raise AuthenticationFailed("Token is invalid") from exc
