from rest_framework import serializers

from auth_tenancy.domain.value_objects import GlobalRole


class UpdateUserGlobalRoleSerializer(serializers.Serializer):
    global_role = serializers.ChoiceField(choices=GlobalRole.values())
