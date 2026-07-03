import { buildAuthenticatedRequestInit } from "./authApi.js";

const ADMIN_CATALOG_BASE =
  import.meta.env?.VITE_ADMIN_CATALOG_API_URL || "/api/admin";
const COMPANY_CATALOG_BASE =
  import.meta.env?.VITE_COMPANY_CATALOG_API_URL || "/api/catalog";

async function parseJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return null;
}

function adminAuthHeaders(accessToken) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

function buildDefaultServiceInputSchema() {
  return {
    fields: [
      {
        name: "customerRef",
        type: "string",
        label: "Documento",
        required: true,
      },
    ],
  };
}

function slugifyServiceId(value) {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 50);

  return slug;
}

export async function createCatalogCompany(accessToken, { id, name, nit }) {
  const response = await fetch(`${ADMIN_CATALOG_BASE}/companies`, {
    method: "POST",
    headers: adminAuthHeaders(accessToken),
    body: JSON.stringify({
      id: String(id),
      name,
      nit,
    }),
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || "No se pudo crear la empresa en catálogo");
  }

  return data?.data ?? data;
}

export async function createCatalogService(accessToken, { companyId, name }) {
  const serviceId = slugifyServiceId(name);

  if (!serviceId) {
    throw new Error("Se requiere un nombre de servicio válido");
  }

  const response = await fetch(`${ADMIN_CATALOG_BASE}/services`, {
    method: "POST",
    headers: adminAuthHeaders(accessToken),
    body: JSON.stringify({
      id: serviceId,
      companyId: Number(companyId),
      name,
      inputSchema: buildDefaultServiceInputSchema(),
    }),
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || "No se pudo crear el servicio en catálogo");
  }

  return data?.data ?? data;
}

export async function listAdminCompanyCatalogServices(accessToken, companyId) {
  const response = await fetch(
    `${ADMIN_CATALOG_BASE}/companies/${encodeURIComponent(String(companyId))}/services`,
    {
      headers: adminAuthHeaders(accessToken),
    },
  );

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || "No se pudieron cargar los servicios del catálogo");
  }

  return data?.data ?? data ?? [];
}

export async function listProviderCatalogServices(accessToken, companyId) {
  const response = await fetch(
    `${COMPANY_CATALOG_BASE}/company/services`,
    buildAuthenticatedRequestInit({
      method: "GET",
      accessToken,
      companyId,
    }),
  );

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || "No se pudieron cargar los servicios del catálogo");
  }

  return data?.data ?? data ?? [];
}

export const listCompanyCatalogServices = listAdminCompanyCatalogServices;

export async function syncProviderCatalog(accessToken, { companyId, name, nit }) {
  try {
    await createCatalogCompany(accessToken, { id: companyId, name, nit });
  } catch (error) {
    if (!/exist|duplicate|ya existe/i.test(error.message)) {
      throw error;
    }
  }

  try {
    await createCatalogService(accessToken, { companyId, name });
  } catch (error) {
    if (!/exist|duplicate|ya existe/i.test(error.message)) {
      throw error;
    }
  }
}
