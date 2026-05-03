from django.db import models

from auth_tenancy.domain.value_objects import CompanyStatus


class CompanyModel(models.Model):
    name = models.CharField(max_length=150)
    nit = models.CharField(max_length=30, unique=True)
    fiscal_address = models.CharField(max_length=255, blank=True, null=True)
    logo_url = models.URLField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=[(status.value, status.value) for status in CompanyStatus],
        default=CompanyStatus.PENDING.value,
    )
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("id",)

    def __str__(self):
        return self.name
