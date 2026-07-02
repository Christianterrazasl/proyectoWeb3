from django.db import models
from auth_tenancy.domain.value_objects import CompanyStatus

class CompanyModel(models.Model):
    name = models.CharField(max_length=150)
    nit = models.CharField(max_length=30, unique=True)
    fiscal_address = models.CharField(max_length=255, blank=True, null=True)
    active = models.BooleanField(default=True)
    logo_url = models.URLField(max_length=500, blank=True, null=True)

    slug = models.SlugField(max_length=150, unique=True, blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    short_description = models.TextField(blank=True, null=True)
    is_public = models.BooleanField(default=False)

    status = models.CharField(
        max_length=20,
        choices=[(s.name, s.value) for s in CompanyStatus],
        default=CompanyStatus.PENDING.value
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'auth_company'

    def __str__(self):
        return self.name
