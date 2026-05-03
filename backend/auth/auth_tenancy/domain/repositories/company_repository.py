from __future__ import annotations

from abc import ABC, abstractmethod

from auth_tenancy.domain.entities import Company


class CompanyRepository(ABC):
    @abstractmethod
    def exists_by_nit(self, nit: str, exclude_company_id: int | None = None) -> bool:
        raise NotImplementedError

    @abstractmethod
    def get_by_id(self, company_id: int) -> Company | None:
        raise NotImplementedError

    @abstractmethod
    def list_all(self) -> list[Company]:
        raise NotImplementedError

    @abstractmethod
    def list_by_ids(self, company_ids: list[int]) -> list[Company]:
        raise NotImplementedError

    @abstractmethod
    def save(self, company: Company) -> Company:
        raise NotImplementedError

    @abstractmethod
    def update(self, company: Company) -> Company:
        raise NotImplementedError
