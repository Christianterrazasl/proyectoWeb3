from __future__ import annotations

from abc import ABC, abstractmethod

from auth_tenancy.domain.entities import User


class UserRepository(ABC):
    @abstractmethod
    def exists_by_email(self, email: str) -> bool:
        raise NotImplementedError

    @abstractmethod
    def get_by_email(self, email: str) -> User | None:
        raise NotImplementedError

    @abstractmethod
    def get_by_id(self, user_id: int) -> User | None:
        raise NotImplementedError

    @abstractmethod
    def list_all(self) -> list[User]:
        raise NotImplementedError

    @abstractmethod
    def list_by_company(self, company_id: int) -> list[User]:
        raise NotImplementedError

    @abstractmethod
    def save(self, user: User) -> User:
        raise NotImplementedError

    @abstractmethod
    def update(self, user: User) -> User:
        raise NotImplementedError
