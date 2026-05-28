from __future__ import annotations

from django.conf import settings
from django.db import models

from auth_tenancy.domain.value_objects import CompanyRole
from auth_tenancy.infrastructure.persistence.models.company_model import CompanyModel


class MembershipModel(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="memberships")
    company = models.ForeignKey(CompanyModel, on_delete=models.CASCADE, related_name="memberships")
    company_role = models.CharField(
        max_length=20,
        choices=[(role.value, role.value) for role in CompanyRole],
        default=CompanyRole.PROVIDER.value,
    )
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("id",)
        unique_together = ("user", "company")

    def __str__(self) -> str:
        return f"{self.user.email} - {self.company.name} ({self.company_role})"
