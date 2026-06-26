class UserDTO:
    def __init__(self, id: str, email: str, global_role: str, tenant_id: str = None):
        self.id = id
        self.email = email
        self.global_role = global_role
        self.tenant_id = tenant_id

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "global_role": self.global_role,
            "tenant_id": self.tenant_id
        }

class AuthResponseDTO:
    def __init__(self, token: str, user: UserDTO):
        self.token = token
        self.user = user

    def to_dict(self):
        return {
            "token": self.token,
            "user": self.user.to_dict()
        }
