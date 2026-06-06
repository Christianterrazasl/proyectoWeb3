import { fetchCompanies } from "../../infrastructure/auth/companyClient.js";
import { fetchAdminServices } from "../../infrastructure/catalog/serviceClient.js";
import { fetchDebts } from "../../infrastructure/debts/debtClient.js";
import { fetchAdminTransactions } from "../../infrastructure/payments/transactionClient.js";

function createUpstreamError(message, status) {
    const error = new Error(message);
    error.status = status;
    return error;
}

// Cada upstream responde con contratos levemente distintos.
// Esta normalización evita que el resumen conozca detalles de paginación
// o envoltorios (`data`, `results`) de otros servicios.
function normalizeCollection(body) {
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

// Algunos dominios exponen la misma idea con nombres diferentes.
// Buscamos varias llaves para no acoplar el resumen a un único contrato.
function readField(item, ...keys){
    for(const key of keys){
        if(item?.[key] !== undefined && item?.[key] !== null){
            return item[key];
        }
    }
    return null;
}

function normalizeStatus(value) {
  return String(value || "").trim().toUpperCase();
}

function toSafeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

// Si el dashboard está acotado a una empresa, el resumen solo debe contar
// registros de esa empresa. Si no hay scope, se devuelve la vista global.
function filterByCompany(items, companyId, candidateKeys) {
  if (companyId === null || companyId === undefined) {
    return items;
  }

  return items.filter((item) => {
    const itemCompanyId = readField(item, ...candidateKeys);
    return String(itemCompanyId) === String(companyId);
  });
}

// Construye las tarjetas principales del dashboard admin a partir de datasets
// que pertenecen a otros microservicios. `reportes` no es dueño de empresas,
// servicios, deudas ni transacciones: solo compone una vista agregada.
//
// Campos devueltos:
// - `company_scope`: empresa filtrada o `null` si el tablero es global.
// - `total_*` / `active_*` / `published_*`: volumen actual por dominio.
// - `pending_debts` y `pending_amount`: presión de cartera pendiente.
// - `*_transactions` y `approval_rate`: salud operativa del flujo de pagos.
function buildSummary({
  companyId,
  companies,
  services,
  debts,
  transactions,
}) {
  // El mismo `companyId` se aplica sobre todos los datasets para que las
  // tarjetas representen el MISMO alcance funcional del dashboard.
  const scopedCompanies = filterByCompany(companies, companyId, ["id", "company_id"]);
  const scopedServices = filterByCompany(services, companyId, ["companyId", "company_id"]);
  const scopedDebts = filterByCompany(debts, companyId, ["tenant_id", "company_id"]);
  const scopedTransactions = filterByCompany(transactions, companyId, ["tenant_id", "company_id"]);

  const activeCompanies = scopedCompanies.filter((company) => {
    return readField(company, "active") === true;
  });

  const publishedServices = scopedServices.filter((service) => {
    return readField(service, "isPublished", "is_published") === true;
  });

  const pendingDebts = scopedDebts.filter((debt) => {
    return normalizeStatus(readField(debt, "status")) === "PENDING";
  });

  const successfulTransactions = scopedTransactions.filter((transaction) => {
    return normalizeStatus(readField(transaction, "status")) === "SUCCESS";
  });

  const failedTransactions = scopedTransactions.filter((transaction) => {
    return normalizeStatus(readField(transaction, "status")) === "FAILED";
  });

  const pendingTransactions = scopedTransactions.filter((transaction) => {
    return normalizeStatus(readField(transaction, "status")) === "PENDING";
  });

  const pendingAmount = pendingDebts.reduce((total, debt) => {
    return total + toSafeNumber(readField(debt, "amount"));
  }, 0);

  const totalTransactions = scopedTransactions.length;
  const approvalRate =
    totalTransactions === 0
      ? 0
      : Number(
          ((successfulTransactions.length / totalTransactions) * 100).toFixed(2),
        );

  return {
    company_scope: companyId,
    total_companies: scopedCompanies.length,
    active_companies: activeCompanies.length,
    total_services: scopedServices.length,
    published_services: publishedServices.length,
    total_debts: scopedDebts.length,
    pending_debts: pendingDebts.length,
    pending_amount: pendingAmount,
    total_transactions: totalTransactions,
    successful_transactions: successfulTransactions.length,
    failed_transactions: failedTransactions.length,
    pending_transactions: pendingTransactions.length,
    approval_rate: approvalRate,
  };
}

export class GetDashboardSummaryHandler {
  constructor({
    fetchCompaniesFn = fetchCompanies,
    fetchAdminServicesFn = fetchAdminServices,
    fetchDebtsFn = fetchDebts,
    fetchAdminTransactionsFn = fetchAdminTransactions,
  } = {}) {
    this.fetchCompaniesFn = fetchCompaniesFn;
    this.fetchAdminServicesFn = fetchAdminServicesFn;
    this.fetchDebtsFn = fetchDebtsFn;
    this.fetchAdminTransactionsFn = fetchAdminTransactionsFn;
  }

  // Orquesta la lectura del dashboard admin y consolida una respuesta única.
  // Existe para evitar que el frontend tenga que pedir cuatro servicios,
  // reconciliar contratos distintos y repetir lógica de agregación.
  async execute(query) {
    // Se piden empresas, servicios, deudas y transacciones porque cada tarjeta
    // del dashboard depende de un dominio distinto. `reportes` solo compone:
    // NO persiste esos datos ni rompe ownership entre servicios.
    const [companiesResult, servicesResult, debtsResult, transactionsResult] =
      await Promise.all([
        this.fetchCompaniesFn({
          authorization: query.authorization,
        }),
        this.fetchAdminServicesFn({
          authorization: query.authorization,
          companyId: query.companyId,
        }),
        this.fetchDebtsFn({
          tenantId: query.companyId,
        }),
        this.fetchAdminTransactionsFn({
          authorization: query.authorization,
          tenant_id: query.companyId,
          from: query.from,
          to: query.to,
        }),
      ]);

    // Si un upstream falla, abortamos todo el resumen. Entregar métricas mezcladas
    // con datos faltantes sería engañoso para un dashboard ejecutivo.
    if (!companiesResult.ok) {
      throw createUpstreamError(
        companiesResult.body?.detail ||
          companiesResult.body?.message ||
          "No se pudo obtener la lista de empresas.",
        companiesResult.status,
      );
    }

    if (!servicesResult.ok) {
      throw createUpstreamError(
        servicesResult.body?.detail ||
          servicesResult.body?.message ||
          "No se pudo obtener la lista de servicios.",
        servicesResult.status,
      );
    }

    if (!debtsResult.ok) {
      throw createUpstreamError(
        debtsResult.body?.detail ||
          debtsResult.body?.message ||
          "No se pudo obtener la lista de deudas.",
        debtsResult.status,
      );
    }

    if (!transactionsResult.ok) {
      throw createUpstreamError(
        transactionsResult.body?.detail ||
          transactionsResult.body?.message ||
          "No se pudo obtener la lista de transacciones.",
        transactionsResult.status,
      );
    }

    const companies = normalizeCollection(companiesResult.body);
    const services = normalizeCollection(servicesResult.body);
    const debts = normalizeCollection(debtsResult.body);
    const transactions = normalizeCollection(transactionsResult.body);

    // El output final queda listo para tarjetas/resúmenes: volumen del ecosistema,
    // cartera pendiente y desempeño transaccional, todo bajo el mismo scope.
    return buildSummary({
      companyId: query.companyId,
      companies,
      services,
      debts,
      transactions,
    });
  }
}
