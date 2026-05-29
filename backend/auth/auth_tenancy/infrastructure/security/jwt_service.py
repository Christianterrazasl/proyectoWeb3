from rest_framework_simplejwt.tokens import RefreshToken


class JWTService:
    def issue_tokens(self, user) -> dict[str, str]:
        refresh = RefreshToken()
        refresh["user_id"] = user.id
        refresh["email"] = str(user.email)
        refresh["username"] = user.username
        refresh["global_role"] = user.global_role.value

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }
