const DEUDAS_API_BASE = import.meta.env.VITE_DEUDAS_API_URL || "/debts";
const ADMIN_DEBTS_BASE = import.meta.env.VITE_ADMIN_DEBTS_API_URL || "/api/admin/debts";

async function parseJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return null;
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

// Este endpoint YA existe en backend.
// Devuelve el proveedor seleccionado y las deudas pendientes reales
// del customerRef para ese tenant/proveedor.
export async function getProviderCustomerDebts(tenantId, customerRef) {
  const response = await fetch(
    `${DEUDAS_API_BASE}/providers/${encodeURIComponent(
      tenantId,
    )}/customers/${encodeURIComponent(customerRef)}`,
  );

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(
      data?.message || "Error al cargar las deudas del cliente",
    );
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
  const url = new URL(ADMIN_DEBTS_BASE, window.location.origin);
  if (status) {
    url.searchParams.set("status", status);
  }

  const response = await fetch(url.pathname + url.search, {
    headers: authHeaders(accessToken, companyId),
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || "No se pudieron cargar las deudas del proveedor");
  }

  return data?.data ?? [];
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