import { buildAuthenticatedRequestInit } from "./authApi.js";

const REPORTS_API_BASE = import.meta.env?.VITE_REPORTS_API_URL || "/api";

const ADMIN_EXPORTS = {
  "companies-csv": {
    path: "/admin/exports/companies.csv",
    fallbackFilename: "companies-report.csv",
  },
  "companies-xlsx": {
    path: "/admin/exports/companies.xlsx",
    fallbackFilename: "companies-report.xlsx",
  },
  "services-csv": {
    path: "/admin/exports/services.csv",
    fallbackFilename: "services-kpi-report.csv",
  },
  "services-xlsx": {
    path: "/admin/exports/services.xlsx",
    fallbackFilename: "services-kpi-report.xlsx",
  },
  "transactions-csv": {
    path: "/admin/exports/transactions.csv",
    fallbackFilename: "transactions-monitoring.csv",
  },
  "transactions-xlsx": {
    path: "/admin/exports/transactions.xlsx",
    fallbackFilename: "transactions-monitoring.xlsx",
  },
 };

async function parseJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return null;
}

function parseDownloadFilename(contentDisposition, fallbackFilename) {
  const filenameMatch = String(contentDisposition || "").match(/filename="?([^";]+)"?/i);
  return filenameMatch?.[1] || fallbackFilename;
}

function triggerBrowserDownload(blob, filename) {
  const objectUrl = globalThis.URL.createObjectURL(blob);

  try {
    const link = globalThis.document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    link.click();
  } finally {
    globalThis.URL.revokeObjectURL(objectUrl);
  }
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

async function downloadAdminExport(exportKey, accessToken, companyId) {
  const config = ADMIN_EXPORTS[exportKey];
  const response = await fetch(
    `${REPORTS_API_BASE}${config.path}`,
    buildAuthenticatedRequestInit({
      method: "GET",
      accessToken,
      companyId,
    }),
  );

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || data?.detail || "No se pudo exportar el reporte");
  }

  const blob = await response.blob();

  if (!blob.size) {
    throw new Error("La exportación no devolvió datos");
  }

  const filename = parseDownloadFilename(
    response.headers.get("content-disposition"),
    config.fallbackFilename,
  );

  triggerBrowserDownload(blob, filename);

  return {
    filename,
    size: blob.size,
  };
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

export async function downloadAdminCompaniesCsv(accessToken, companyId) {
  return downloadAdminExport("companies-csv", accessToken, companyId);
}

export async function downloadAdminCompaniesXlsx(accessToken, companyId) {
  return downloadAdminExport("companies-xlsx", accessToken, companyId);
}

export async function downloadAdminServicesCsv(accessToken, companyId) {
  return downloadAdminExport("services-csv", accessToken, companyId);
}

export async function downloadAdminServicesXlsx(accessToken, companyId) {
  return downloadAdminExport("services-xlsx", accessToken, companyId);
}

export async function downloadAdminTransactionsCsv(accessToken, companyId) {
  return downloadAdminExport("transactions-csv", accessToken, companyId);
}

export async function downloadAdminTransactionsXlsx(accessToken, companyId) {
  return downloadAdminExport("transactions-xlsx", accessToken, companyId);
}
