from django.urls import path

from auth_tenancy.interfaces.api.views.auth_views import (
    RegisterUserView,
    LoginUserView,
    MeView,
)
from auth_tenancy.interfaces.api.views.company_views import (
    CompanyDetailView,
    CompanyListCreateView,
    CompanyStatusView,
)
from auth_tenancy.interfaces.api.views.membership_views import MembershipDetailView, MembershipListCreateView
from auth_tenancy.interfaces.api.views.user_views import UserDetailView, UserGlobalRoleView, UserListView

urlpatterns = [
    path("register/", RegisterUserView.as_view(), name="register-user"),
    path("login/", LoginUserView.as_view(), name="login-user"),
    path("me/", MeView.as_view(), name="me"),
    path("users/", UserListView.as_view(), name="users"),
    path("users/<int:user_id>/", UserDetailView.as_view(), name="user-detail"),
    path("users/<int:user_id>/global-role/", UserGlobalRoleView.as_view(), name="update-user-global-role"),
    path("users/<int:user_id>/role/", UserGlobalRoleView.as_view(), name="legacy-update-user-role"),
    path("companies/", CompanyListCreateView.as_view(), name="companies"),
    path("companies/<int:company_id>/", CompanyDetailView.as_view(), name="company-detail"),
    path("companies/<int:company_id>/status/", CompanyStatusView.as_view(), name="company-status"),
    path("memberships/", MembershipListCreateView.as_view(), name="memberships"),
    path("memberships/<int:membership_id>/", MembershipDetailView.as_view(), name="membership-detail"),
    path("user-companies/", MembershipListCreateView.as_view(), name="legacy-user-companies"),
]
