from django.contrib.auth.hashers import check_password, make_password


class PasswordHasher:
    def hash(self, raw_password: str) -> str:
        return make_password(raw_password)

    def verify(self, raw_password: str, hashed_password: str) -> bool:
        return check_password(raw_password, hashed_password)
