from rest_framework.permissions import IsAuthenticated

from auth_tenancy.application.commands import (
    ChangeCompanyStatusCommand,
    CreateCompanyCommand,
    DeleteCompanyCommand,
    UpdateCompanyCommand,
)
from auth_tenancy.application.queries import GetCompanyDetailQuery, ListCompaniesQuery
from auth_tenancy.interfaces.api.dependencies import (
    get_change_company_status_handler,
    get_company_detail_handler,
    get_create_company_handler,
    get_delete_company_handler,
    get_list_companies_handler,
    get_update_company_handler,
)
from auth_tenancy.infrastructure.persistence.models import CompanyModel
from auth_tenancy.interfaces.api.permissions import IsAdmin
from auth_tenancy.interfaces.api.serializers import (
    ChangeCompanyStatusSerializer,
    CreateCompanySerializer,
    UpdateCompanySerializer,
)
from auth_tenancy.interfaces.api.views.base import BaseApiView
from rest_framework.permissions import AllowAny
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response


class CompanyListCreateView(BaseApiView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    def get(self, request):
        handler = get_list_companies_handler()

        try:
            result = handler.handle(
                ListCompaniesQuery(
                    actor_id=request.user.id,
                    actor_role=request.user.global_role,
                )
            )
            return self.success_response(result)
        except Exception as error:
            return self.handle_domain_exception(error)

    def post(self, request):
        serializer = CreateCompanySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        handler = get_create_company_handler()

        try:
            result = handler.handle(
                CreateCompanyCommand(
                    actor_id=request.user.id,
                    actor_role=request.user.global_role,
                    name=serializer.validated_data["name"],
                    nit=serializer.validated_data["nit"],
                    fiscal_address=serializer.validated_data.get("fiscal_address"),
                    logo_url=serializer.validated_data.get("logo_url"),
                    description=serializer.validated_data.get("description"),
                    category=serializer.validated_data.get("category"),
                )
            )
            return self.success_response(result, status_code=201)
        except Exception as error:
            return self.handle_domain_exception(error)


class CompanyDetailView(BaseApiView):
    def get_permissions(self):
        if self.request.method in {"PATCH", "DELETE"}:
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    def get(self, request, company_id: int):
        handler = get_company_detail_handler()

        try:
            result = handler.handle(
                GetCompanyDetailQuery(
                    actor_id=request.user.id,
                    actor_role=request.user.global_role,
                    company_id=company_id,
                )
            )
            return self.success_response(result)
        except Exception as error:
            return self.handle_domain_exception(error)

    def patch(self, request, company_id: int):
        serializer = UpdateCompanySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        handler = get_update_company_handler()

        try:
            result = handler.handle(
                UpdateCompanyCommand(
                    actor_id=request.user.id,
                    actor_role=request.user.global_role,
                    company_id=company_id,
                    name=serializer.validated_data["name"],
                    nit=serializer.validated_data["nit"],
                    fiscal_address=serializer.validated_data.get("fiscal_address"),
                    logo_url=serializer.validated_data.get("logo_url"),
                    active=serializer.validated_data["active"],
                )
            )
            return self.success_response(result)
        except Exception as error:
            return self.handle_domain_exception(error)

    def delete(self, request, company_id: int):
        handler = get_delete_company_handler()

        try:
            result = handler.handle(
                DeleteCompanyCommand(
                    actor_id=request.user.id,
                    actor_role=request.user.global_role,
                    company_id=company_id,
                )
            )
            return self.success_response(result)
        except Exception as error:
            return self.handle_domain_exception(error)


class CompanyStatusView(BaseApiView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def patch(self, request, company_id: int):
        serializer = ChangeCompanyStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        handler = get_change_company_status_handler()

        try:
            result = handler.handle(
                ChangeCompanyStatusCommand(
                    actor_id=request.user.id,
                    actor_role=request.user.global_role,
                    company_id=company_id,
                    status=serializer.validated_data["status"],
                )
            )
            return self.success_response(result)
        except Exception as error:
            return self.handle_domain_exception(error)

class PublicCompanyListView(APIView):
    """ GET /api/auth/public/companies/ -> Devuelve tarjetas para el Home """
    permission_classes = [AllowAny]

    def get(self, request):
        companies = CompanyModel.objects.filter(is_public=True, status='APPROVED').values(
            'id', 'name', 'logo_url', 'slug', 'category', 'short_description'
        )
        return Response({
            "success": True,
            "data": list(companies)
        })


class PublicCompanyDetailView(APIView):
    """ GET /api/auth/public/companies/:slug -> Devuelve metadata de 1 sola empresa """
    permission_classes = [AllowAny]

    def get(self, request, identifier):
        # Soporta buscar por Slug o por UUID (Retrocompatibilidad)
        try:
            import uuid
            uuid_obj = uuid.UUID(identifier)
            q_filter = Q(id=uuid_obj)
        except ValueError:
            q_filter = Q(slug=identifier)

        company = CompanyModel.objects.filter(
            q_filter, is_public=True, status='APPROVED'
        ).values(
            'id', 'name', 'logo_url', 'slug', 'category', 'short_description', 'fiscal_address'
        ).first()

        if not company:
            return Response({"success": False, "message": "Empresa pública no encontrada"}, status=404)

        return Response({
            "success": True,
            "data": company
        })
