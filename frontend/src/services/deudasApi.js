const DEUDAS_API_BASE = import.meta.env.VITE_DEUDAS_API_URL || "/debts";

export async function searchProvidersByDocument(customerRef) {
  const response = await fetch(`${DEUDAS_API_BASE}/lookup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ customerRef }),
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(data?.message || "Error al buscar deudas");
  }

  return data?.data ?? [];
}

export async function getPublicProviders() {
  const response = await fetch(`${DEUDAS_API_BASE}/providers`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Error al cargar proveedores");
  }

  return data.data ?? [];
}
