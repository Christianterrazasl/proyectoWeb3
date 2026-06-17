from dataclasses import dataclass


@dataclass(slots=True)
class LoginUserCommand:
    email: str
    password: str
