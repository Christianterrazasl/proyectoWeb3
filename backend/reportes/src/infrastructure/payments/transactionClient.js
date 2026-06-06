const DEFAULT_PAYMENTS_ADMIN_TRANSACTIONS_URL =
  process.env.PAYMENTS_ADMIN_TRANSACTIONS_URL ||
  "http://pagos:3000/api/payments/admin/transactions";

function appendOptionalParam(searchParams, key, value) {
  // Evita enviar filtros vacíos para que `pagos` conserve sus defaults naturales.
  if (value === null || value === undefined || value === "") {
    return;
  }

  searchParams.set(key, String(value));
}

export function createTransactionClient({
  transactionsUrl = DEFAULT_PAYMENTS_ADMIN_TRANSACTIONS_URL,
  fetchImpl = fetch,
} = {}) {
  /**
   * Reutiliza la vista admin de transacciones de `pagos`.
   * Reportes delega filtros y propiedad del dato al servicio transaccional, y solo enriquece la respuesta.
   */
  return async function fetchAdminTransactions({
    authorization,
    tenant_id,
    service_id,
    status,
    customer_ref,
    from,
    to,
  } = {}) {
    const url = new URL(transactionsUrl);

    appendOptionalParam(url.searchParams, "tenant_id", tenant_id);
    appendOptionalParam(url.searchParams, "service_id", service_id);
    appendOptionalParam(url.searchParams, "status", status);
    appendOptionalParam(url.searchParams, "customer_ref", customer_ref);
    appendOptionalParam(url.searchParams, "from", from);
    appendOptionalParam(url.searchParams, "to", to);

    const headers = {
      Accept: "application/json",
    };

    if (authorization) {
      headers.Authorization = authorization;
    }

    try {
      const response = await fetchImpl(url, {
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
          detail: "No se pudo contactar al servicio de pagos.",
        },
      };
    }
  };
}

export const fetchAdminTransactions = createTransactionClient();
