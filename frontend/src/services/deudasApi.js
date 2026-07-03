const DEUDAS_API_BASE = import.meta.env?.VITE_DEUDAS_API_URL || "/debts";
const ADMIN_DEBTS_BASE =
  import.meta.env?.VITE_ADMIN_DEBTS_API_URL || "/api/admin/debts";
const ADMIN_PROVIDERS_BASE =
  import.meta.env?.VITE_ADMIN_PROVIDERS_API_URL || "/api/admin/providers";
const CATALOG_API_BASE =
  import.meta.env?.VITE_CATALOG_API_URL || "/api/catalog";

async function parseJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return null;
}

function getAdminDebtsUrl(status) {
  const origin = globalThis.window?.location?.origin || "http://localhost";
  const url = new URL(ADMIN_DEBTS_BASE, origin);

  if (status) {
    url.searchParams.set("status", status);
  }

  return url.pathname + url.search;
}

export async function getPublicCatalogServices() {
  const response = await fetch(`${CATALOG_API_BASE}/public/services`);
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(
      data?.message || "Error al cargar los servicios disponibles",
    );
  }
  return data?.data || data || [];
}

export async function searchDebtsLookup(tenantId, serviceId, customerRef) {
  const url = new URL(`${DEUDAS_API_BASE}/lookup`, window.location.origin);
  url.searchParams.set("tenantId", tenantId);
  url.searchParams.set("serviceId", serviceId);
  url.searchParams.set("customerRef", customerRef);

  const response = await fetch(url.pathname + url.search);
  const data = await parseJsonResponse(response);

  if (response.status === 404) {
    const error = new Error(
      data?.message || "No tienes deudas pendientes",
    );
    error.status = 404;
    throw error;
  }

  if (!response.ok) {
    throw new Error(data?.message || "Error al buscar deudas");
  }

  const payload = data?.data ?? data;
  if (Array.isArray(payload)) {
    return payload;
  }

  return payload ? [payload] : [];
}

export async function searchProvidersByDocument(customerRef) {
  const response = await fetch(`${DEUDAS_API_BASE}/lookup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ customerRef }),
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || "Error al buscar deudas");
  }

  return data?.data ?? [];
}

export async function getPublicProviders() {
  const response = await fetch(`${DEUDAS_API_BASE}/providers`);
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || "Error al cargar proveedores");
  }

  return data?.data ?? [];
}

export async function getProviderCustomerDebts(tenantId, customerRef) {
  const response = await fetch(
    `${DEUDAS_API_BASE}/providers/${encodeURIComponent(
      tenantId,
    )}/customers/${encodeURIComponent(customerRef)}`,
  );

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || "Error al cargar las deudas del cliente");
  }

  return data?.data ?? { provider: null, customerRef, debts: [] };
}

function authHeaders(accessToken, companyId) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  if (companyId) {
    headers["X-Company-Id"] = String(companyId);
  }

  return headers;
}

export async function listProviderDebts({ accessToken, companyId, status }) {
  const response = await fetch(getAdminDebtsUrl(status), {
    headers: authHeaders(accessToken, companyId),
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(
      data?.message || "No se pudieron cargar las deudas del proveedor",
    );
  }

  return data?.data ?? [];
}

export { getAdminDebtsUrl };

function adminAuthHeaders(accessToken) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function listAdminProviders(accessToken) {
  const response = await fetch(ADMIN_PROVIDERS_BASE, {
    headers: adminAuthHeaders(accessToken),
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || "No se pudieron cargar los proveedores");
  }

  return data?.data ?? [];
}

export async function createAdminProvider({
  accessToken,
  tenantId,
  name,
  description,
  imageUrl,
}) {
  const response = await fetch(ADMIN_PROVIDERS_BASE, {
    method: "POST",
    headers: adminAuthHeaders(accessToken),
    body: JSON.stringify({
      tenantId: String(tenantId),
      name,
      description,
      imageUrl,
    }),
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || "No se pudo registrar el proveedor");
  }

  return data?.data;
}

export async function deleteAdminProvider(accessToken, tenantId) {
  const response = await fetch(
    `${ADMIN_PROVIDERS_BASE}/${encodeURIComponent(String(tenantId))}`,
    {
      method: "DELETE",
      headers: adminAuthHeaders(accessToken),
    },
  );

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || "No se pudo eliminar el proveedor");
  }

  return data?.data;
}

export async function createProviderDebt({
  accessToken,
  companyId,
  tenantId,
  serviceId,
  customerRef,
  period,
  amount,
  dueDate,
}) {
  const response = await fetch(ADMIN_DEBTS_BASE, {
    method: "POST",
    headers: authHeaders(accessToken, companyId),
    body: JSON.stringify({
      tenantId: tenantId || String(companyId),
      serviceId,
      customerRef,
      period,
      amount: Number(amount),
      dueDate,
    }),
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || "No se pudo crear la deuda");
  }

  return data?.data;
}

export async function importAdminDebts({
  accessToken,
  companyId,
  filename,
  csvContent,
}) {
  const response = await fetch(`${ADMIN_DEBTS_BASE}/import`, {
    method: "POST",
    headers: authHeaders(accessToken, companyId),
    body: JSON.stringify({
      filename,
      csvContent,
    }),
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || "No se pudo importar el archivo de deudas");
  }

  return data?.data;
}
