from __future__ import annotations

from dataclasses import asdict, is_dataclass

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from auth_tenancy.domain.exceptions import (
    AuthenticationError,
    AuthorizationError,
    ConflictError,
    NotFoundError,
    ValidationError,
)


def serialize_payload(payload):
    if isinstance(payload, list):
        return [serialize_payload(item) for item in payload]

    if is_dataclass(payload):
        return asdict(payload)

    return payload


class BaseApiView(APIView):
    def success_response(self, payload, status_code=status.HTTP_200_OK):
        return Response(serialize_payload(payload), status=status_code)

    def handle_domain_exception(self, error: Exception) -> Response:
        mapping = {
            ValidationError: status.HTTP_400_BAD_REQUEST,
            AuthenticationError: status.HTTP_401_UNAUTHORIZED,
            AuthorizationError: status.HTTP_403_FORBIDDEN,
            NotFoundError: status.HTTP_404_NOT_FOUND,
            ConflictError: status.HTTP_409_CONFLICT,
            ValueError: status.HTTP_400_BAD_REQUEST,
        }

        for exception_type, status_code in mapping.items():
            if isinstance(error, exception_type):
                return Response({"detail": str(error)}, status=status_code)

        raise error
