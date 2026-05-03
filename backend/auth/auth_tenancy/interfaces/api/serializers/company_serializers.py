from rest_framework import serializers

from auth_tenancy.domain.value_objects import CompanyStatus


class CreateCompanySerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    nit = serializers.CharField(max_length=30)
    fiscal_address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    logo_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)


class UpdateCompanySerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    nit = serializers.CharField(max_length=30)
    fiscal_address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    logo_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    active = serializers.BooleanField()


class ChangeCompanyStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=CompanyStatus.values())
