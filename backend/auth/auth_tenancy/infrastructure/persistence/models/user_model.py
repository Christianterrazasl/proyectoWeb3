from __future__ import annotations

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.db import models

from auth_tenancy.domain.value_objects import GlobalRole


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email: str, username: str, password: str | None = None, **extra_fields):
        if not email:
            raise ValueError("Email is required")

        if not username:
            raise ValueError("Username is required")

        email = self.normalize_email(email).lower()
        extra_fields.setdefault("global_role", GlobalRole.USER.value)

        user = self.model(email=email, username=username, **extra_fields)

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, username: str, password: str, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("global_role", GlobalRole.ADMIN.value)

        return self.create_user(email=email, username=username, password=password, **extra_fields)


class UserModel(AbstractBaseUser):
    username = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    global_role = models.CharField(
        max_length=20,
        choices=[(role.value, role.value) for role in GlobalRole],
        default=GlobalRole.USER.value,
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    objects = UserManager()

    class Meta:
        ordering = ("id",)

    def __str__(self) -> str:
        return self.email

    def has_perm(self, perm, obj=None) -> bool:
        return self.is_staff or self.global_role == GlobalRole.ADMIN.value

    def has_module_perms(self, app_label) -> bool:
        return self.is_staff or self.global_role == GlobalRole.ADMIN.value
