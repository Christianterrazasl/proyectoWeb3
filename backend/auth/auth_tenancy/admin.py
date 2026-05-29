from django.contrib import admin

from auth_tenancy.models import CompanyModel, MembershipModel, UserModel


@admin.register(UserModel)
class UserAdmin(admin.ModelAdmin):
    list_display = ("id", "email", "username", "global_role", "is_active", "is_staff")
    list_filter = ("global_role", "is_active", "is_staff")
    search_fields = ("email", "username")


@admin.register(CompanyModel)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "nit", "status", "active")
    list_filter = ("status", "active")
    search_fields = ("name", "nit")


@admin.register(MembershipModel)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "company", "company_role", "active")
    list_filter = ("company_role", "active")
    search_fields = ("user__email", "company__name")
