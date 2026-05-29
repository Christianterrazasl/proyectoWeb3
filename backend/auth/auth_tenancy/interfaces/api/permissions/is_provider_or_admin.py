from rest_framework.permissions import BasePermission


class IsProviderOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "global_role", None) in {"admin", "provider"}
        )
