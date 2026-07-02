const ADMIN_CATALOG_BASE =
  import.meta.env?.VITE_ADMIN_CATALOG_API_URL || "/api/admin";

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

function slugifyServiceId(value) {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 50);

  return slug || `servicio-${Date.now()}`;
}

export async function createCatalogCompany(accessToken, { id, name }) {
  const response = await fetch(`${ADMIN_CATALOG_BASE}/companies`, {
    method: "POST",
    headers: adminAuthHeaders(accessToken),
    body: JSON.stringify({
      id: String(id),
      name,
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

  const response = await fetch(`${ADMIN_CATALOG_BASE}/services`, {
    method: "POST",
    headers: adminAuthHeaders(accessToken),
    body: JSON.stringify({
      id: serviceId,
      companyId: Number(companyId),
      name,
      inputSchema: {
        label: "Cédula de identidad",
        type: "text",
        placeholder: "Ej: 1234567",
      },
    }),
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data?.message || "No se pudo crear el servicio en catálogo");
  }

  return data?.data ?? data;
}

export async function syncProviderCatalog(accessToken, { companyId, name }) {
  try {
    await createCatalogCompany(accessToken, { id: companyId, name });
  } catch (error) {
    if (!/exist|duplicate|ya existe/i.test(error.message)) {
      throw error;
    }
  }

  await createCatalogService(accessToken, {
    companyId,
    name: `Pago ${name}`,
  });
}
