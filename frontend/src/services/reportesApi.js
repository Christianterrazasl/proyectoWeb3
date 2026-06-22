import { getAccessToken } from "../utils/authStorage";

const REPORTS_API_BASE = import.meta.env.VITE_REPORTS_API_URL || "/api";

async function parseJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return null;
}

export async function getDashboardSummary(accessToken) {
  const response = await fetch(`${REPORTS_API_BASE}/admin/dashboard/summary`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || data?.detail || "No se pudo cargar el resumen");
  }

  return data?.data ?? data;
}
