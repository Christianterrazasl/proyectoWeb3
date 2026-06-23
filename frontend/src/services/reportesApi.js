import { buildAuthenticatedRequestInit } from "./authApi.js";

const REPORTS_API_BASE = import.meta.env?.VITE_REPORTS_API_URL || "/api";

async function parseJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return null;
}

async function fetchAdminReport(path, accessToken, companyId) {
  const response = await fetch(
    `${REPORTS_API_BASE}${path}`,
    buildAuthenticatedRequestInit({
      method: "GET",
      accessToken,
      companyId,
      headers: {
        Accept: "application/json",
      },
    }),
  );

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || data?.detail || "No se pudo cargar el reporte");
  }

  return data?.data ?? data;
}

export async function getDashboardSummary(accessToken, companyId) {
  return fetchAdminReport("/admin/dashboard/summary", accessToken, companyId);
}

export async function getCompanyPortfolioSummary(accessToken, companyId) {
  return fetchAdminReport(
    "/admin/reports/companies/portfolio-summary",
    accessToken,
    companyId,
  );
}

export async function getServiceKpis(accessToken, companyId) {
  return fetchAdminReport(
    "/admin/reports/services/kpis",
    accessToken,
    companyId,
  );
}

export async function getTransactionMonitoring(accessToken, companyId) {
  return fetchAdminReport(
    "/admin/reports/transactions/monitoring",
    accessToken,
    companyId,
  );
}

export async function getAuditLogs(accessToken, companyId) {
  return fetchAdminReport("/admin/audit-logs", accessToken, companyId);
}
