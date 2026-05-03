from __future__ import annotations

from auth_tenancy.domain.entities import User
from auth_tenancy.domain.repositories import UserRepository
from auth_tenancy.infrastructure.persistence.mappers import UserMapper
from auth_tenancy.infrastructure.persistence.models import UserModel


class DjangoUserRepository(UserRepository):
    def exists_by_email(self, email: str) -> bool:
        return UserModel.objects.filter(email=email).exists()

    def get_by_email(self, email: str) -> User | None:
        model = UserModel.objects.filter(email=email).first()
        return UserMapper.to_domain(model) if model else None

    def get_by_id(self, user_id: int) -> User | None:
        model = UserModel.objects.filter(id=user_id).first()
        return UserMapper.to_domain(model) if model else None

    def list_all(self) -> list[User]:
        return [UserMapper.to_domain(model) for model in UserModel.objects.all()]

    def list_by_company(self, company_id: int) -> list[User]:
        queryset = UserModel.objects.filter(memberships__company_id=company_id, memberships__active=True).distinct()
        return [UserMapper.to_domain(model) for model in queryset]

    def save(self, user: User) -> User:
        model = UserModel(
            username=user.username,
            email=str(user.email),
            global_role=user.global_role.value,
            is_active=user.is_active,
        )
        model.password = user.password_hash
        model.save()
        return UserMapper.to_domain(model)

    def update(self, user: User) -> User:
        model = UserModel.objects.get(id=user.id)
        model.username = user.username
        model.email = str(user.email)
        model.global_role = user.global_role.value
        model.is_active = user.is_active
        model.password = user.password_hash
        model.save(update_fields=["username", "email", "global_role", "is_active", "password", "updated_at"])
        return UserMapper.to_domain(model)
