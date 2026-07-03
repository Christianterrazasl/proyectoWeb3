const DEFAULT_CATALOG_ADMIN_SERVICES_URL =
  process.env.CATALOG_ADMIN_SERVICES_URL ||
  "http://catalogo:3000/api/services";

export function createServiceClient({
  servicesUrl = DEFAULT_CATALOG_ADMIN_SERVICES_URL,
  fetchImpl = fetch,
} = {}) {
  /**
   * Consume la lectura administrativa de catálogo.
   * Reportes no reconstruye servicios: reutiliza la misma vista admin que ya entiende company scope.
   */
  return async function fetchAdminServices({ authorization, companyId = null }) {
    const headers = {
      Accept: "application/json",
      Authorization: authorization,
    };

    if (companyId !== null && companyId !== undefined) {
      headers["X-Company-Id"] = String(companyId);
    }

    try {
      const response = await fetchImpl(servicesUrl, {
        method: "GET",
        headers,
      });

      const body = await response.json().catch(() => null);

      return {
        ok: response.ok,
        status: response.status,
        body,
      };
    } catch {
      return {
        ok: false,
        status: 502,
        body: {
          detail: "No se pudo contactar al servicio de catálogo.",
        },
      };
    }
  };
}

export const fetchAdminServices = createServiceClient();
