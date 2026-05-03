class DomainError(Exception):
    """Base domain exception."""


class ValidationError(DomainError):
    """Raised when a domain invariant is violated."""


class AuthenticationError(DomainError):
    """Raised when authentication fails."""


class AuthorizationError(DomainError):
    """Raised when the actor cannot access a resource."""


class NotFoundError(DomainError):
    """Raised when an entity cannot be found."""


class ConflictError(DomainError):
    """Raised when the action conflicts with current state."""
