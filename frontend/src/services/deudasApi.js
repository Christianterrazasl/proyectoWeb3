const DEUDAS_API_BASE = import.meta.env.VITE_DEUDAS_API_URL || "/debts";

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