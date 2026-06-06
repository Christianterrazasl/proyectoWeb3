import { fetchCompanies } from "../../infrastructure/auth/companyClient.js";
import { fetchAdminServices } from "../../infrastructure/catalog/serviceClient.js";
import { fetchAdminTransactions } from "../../infrastructure/payments/transactionClient.js";

function createUpstreamError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizeCollection(body) {
  // Los tres upstreams pueden variar su envelope; aquí forzamos una colección homogénea.
  if (Array.isArray(body)) {
    return body;
  }

  if (Array.isArray(body?.data)) {
    return body.data;
  }

  if (Array.isArray(body?.results)) {
    return body.results;
  }

  return [];
}

function readField(item, ...keys) {
  // Monitoreo junta datos de dominios con naming distinto; este helper evita bifurcar lógica.
  for (const key of keys) {
    if (item?.[key] !== undefined && item?.[key] !== null) {
      return item[key];
    }
  }

  return null;
}

function buildLookup(items, candidateKeys) {
  // Preparamos índices en memoria para enriquecer transacciones sin reconsultas por fila.
  const lookup = new Map();

  for (const item of items) {
    const key = readField(item, ...candidateKeys);

    if (key === null) {
      continue;
    }

    lookup.set(String(key), item);
  }

  return lookup;
}

function resolveTenantId(query) {
  // Si auth ya cerró el scope por empresa, ese alcance manda sobre cualquier query param libre.
  if (query.companyId !== null && query.companyId !== undefined) {
    return String(query.companyId);
  }

  return query.tenantId ?? null;
}

function buildMonitoringRow(transaction, companiesById, servicesById) {
  // La fila final prioriza ids y estados de `pagos`, y solo suma nombres descriptivos externos.
  const companyId = readField(transaction, "company_id", "tenant_id");
  const serviceId = readField(transaction, "service_id", "serviceId");
  const company = companiesById.get(String(companyId)) || null;
  const service = servicesById.get(String(serviceId)) || null;

  return {
    transaction_id: readField(transaction, "transaction_id", "id"),
    created_at: readField(transaction, "created_at", "createdAt"),
    status: readField(transaction, "status"),
    amount: Number(readField(transaction, "amount") || 0),
    company_id: companyId,
    company_name:
      readField(company, "name", "company_name") ||
      readField(transaction, "company_name") ||
      null,
    service_id: serviceId,
    service_name:
      readField(service, "service_name", "serviceName", "name") ||
      readField(transaction, "service_name") ||
      null,
    customer_ref: readField(transaction, "customer_ref", "customerRef"),
    receipt_hash: readField(transaction, "receipt_hash", "receiptHash"),
  };
}

export class GetTransactionMonitoringHandler {
  constructor({
    fetchAdminTransactionsFn = fetchAdminTransactions,
    fetchAdminServicesFn = fetchAdminServices,
    fetchCompaniesFn = fetchCompanies,
  } = {}) {
    this.fetchAdminTransactionsFn = fetchAdminTransactionsFn;
    this.fetchAdminServicesFn = fetchAdminServicesFn;
    this.fetchCompaniesFn = fetchCompaniesFn;
  }

  async execute(query) {
    const tenantId = resolveTenantId(query);

    // Flujo Slice 3: traer transacciones desde `pagos` y enriquecerlas con nombres
    // consultando `catalogo` y `auth`, sin mover la verdad transaccional a `reportes`.
    const transactionsResult = await this.fetchAdminTransactionsFn({
      authorization: query.authorization,
      tenant_id: tenantId,
      service_id: query.serviceId,
      status: query.status,
      customer_ref: query.customerRef,
      from: query.from,
      to: query.to,
    });

    if (!transactionsResult.ok) {
      throw createUpstreamError(
        transactionsResult.body?.detail ||
          transactionsResult.body?.message ||
          "No se pudo obtener el monitoreo de transacciones.",
        transactionsResult.status,
      );
    }

    // `catalogo` aporta nombres de servicios y `auth` los nombres de empresas
    // para que monitoreo admin pueda leer el contexto completo en una sola respuesta.
    const [servicesResult, companiesResult] = await Promise.all([
      this.fetchAdminServicesFn({
        authorization: query.authorization,
        companyId: query.companyId,
      }),
      this.fetchCompaniesFn({
        authorization: query.authorization,
      }),
    ]);

    if (!servicesResult.ok) {
      throw createUpstreamError(
        servicesResult.body?.detail ||
          servicesResult.body?.message ||
          "No se pudo obtener la lista de servicios administrativos.",
        servicesResult.status,
      );
    }

    if (!companiesResult.ok) {
      throw createUpstreamError(
        companiesResult.body?.detail ||
          companiesResult.body?.message ||
          "No se pudo obtener la lista de empresas.",
        companiesResult.status,
      );
    }

    const transactions = normalizeCollection(transactionsResult.body);
    const services = normalizeCollection(servicesResult.body);
    const companies = normalizeCollection(companiesResult.body);

    const companiesById = buildLookup(companies, ["id", "company_id"]);
    const servicesById = buildLookup(services, ["service_id", "serviceId", "id"]);

    // Reportes solo enriquece nombres para lectura admin; la fuente transaccional sigue en pagos.
    return transactions.map((transaction) =>
      buildMonitoringRow(transaction, companiesById, servicesById),
    );
  }
}
