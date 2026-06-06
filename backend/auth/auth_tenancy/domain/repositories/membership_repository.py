from __future__ import annotations

from abc import ABC, abstractmethod

from auth_tenancy.domain.entities import Membership


class MembershipRepository(ABC):
    @abstractmethod
    def exists(self, user_id: int, company_id: int) -> bool:
        raise NotImplementedError

    @abstractmethod
    def get_by_id(self, membership_id: int) -> Membership | None:
        raise NotImplementedError

    @abstractmethod
    def get_active_by_user_and_company(self, user_id: int, company_id: int) -> Membership | None:
        raise NotImplementedError

    @abstractmethod
    def list_all(self) -> list[Membership]:
        raise NotImplementedError

    @abstractmethod
    def list_by_company(self, company_id: int) -> list[Membership]:
        raise NotImplementedError

    @abstractmethod
    def list_by_user(self, user_id: int) -> list[Membership]:
        raise NotImplementedError

    @abstractmethod
    def list_active_by_user(self, user_id: int) -> list[Membership]:
        raise NotImplementedError

    @abstractmethod
    def list_company_ids_for_user(self, user_id: int) -> list[int]:
        raise NotImplementedError

    @abstractmethod
    def save(self, membership: Membership) -> Membership:
        raise NotImplementedError

    @abstractmethod
    def update(self, membership: Membership) -> Membership:
        raise NotImplementedError
