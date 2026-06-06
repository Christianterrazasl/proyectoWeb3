const DEFAULT_DEBTS_URL = process.env.DEBTS_URL || "http://deudas:3000/debts";

export function createDebtClient({
  debtsUrl = DEFAULT_DEBTS_URL,
  fetchImpl = fetch,
} = {}) {
  /**
   * Lee deudas desde el servicio dueño de la cartera.
   * El filtro `tenant_id` permite que reportes respete un alcance admin acotado por empresa.
   */
  return async function fetchDebts({ tenantId = null } = {}) {
    const url = new URL(debtsUrl);

    if (tenantId !== null && tenantId !== undefined) {
      url.searchParams.set("tenant_id", String(tenantId));
    }

    try {
      const response = await fetchImpl(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
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
          detail: "No se pudo contactar al servicio de deudas.",
        },
      };
    }
  };
}

export const fetchDebts = createDebtClient();
