from dataclasses import dataclass


@dataclass(slots=True)
class RegisterUserCommand:
    username: str
    email: str
    password: str
