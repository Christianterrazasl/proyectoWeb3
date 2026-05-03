from __future__ import annotations

from dataclasses import dataclass

from .user_dto import UserDTO


@dataclass(slots=True)
class LoginResultDTO:
    refresh: str
    access: str
    user: UserDTO
