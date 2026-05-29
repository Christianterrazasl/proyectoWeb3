from __future__ import annotations

from auth_tenancy.application.dto import UserDTO
from auth_tenancy.application.queries import GetCurrentUserQuery
from auth_tenancy.domain.exceptions import NotFoundError
from auth_tenancy.domain.repositories import UserRepository


class GetCurrentUserHandler:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    def handle(self, query: GetCurrentUserQuery) -> UserDTO:
        user = self.user_repository.get_by_id(query.user_id)

        if user is None:
            raise NotFoundError("User not found")

        return UserDTO.from_entity(user)
