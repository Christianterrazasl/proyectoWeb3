const DEFAULT_AUTH_COMPANIES_URL =
  process.env.AUTH_COMPANIES_URL || "http://auth:3000/api/auth/companies/";

export function createCompanyClient({
  authCompaniesUrl = DEFAULT_AUTH_COMPANIES_URL,
  fetchImpl = fetch,
} = {}) {
  /**
   * Obtiene el catálogo de empresas accesibles para la sesión admin.
   * Reportes usa esta lista para nombrar y filtrar portfolios/monitoreos sin duplicar datos maestros.
   */
  return async function fetchCompanies({ authorization }) {
    try {
      const response = await fetchImpl(authCompaniesUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: authorization,
        },
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
          detail: "No se pudo contactar al servicio de autenticación.",
        },
      };
    }
  };
}

export const fetchCompanies = createCompanyClient();
