from rest_framework import serializers

from auth_tenancy.domain.value_objects import CompanyRole


class AssignMembershipSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(min_value=1)
    company_id = serializers.IntegerField(min_value=1)
    company_role = serializers.ChoiceField(choices=CompanyRole.values(), default=CompanyRole.PROVIDER.value)


class UpdateMembershipSerializer(serializers.Serializer):
    company_role = serializers.ChoiceField(choices=CompanyRole.values(), required=False)
    active = serializers.BooleanField(required=False)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("At least one field is required")
        return attrs
