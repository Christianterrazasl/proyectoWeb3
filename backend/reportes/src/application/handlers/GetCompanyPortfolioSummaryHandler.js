import { fetchCompanies } from "../../infrastructure/auth/companyClient.js";
import { fetchDebts } from "../../infrastructure/debts/debtClient.js";

function createUpstreamError(message, status) {
  const error = new Error(message);

  // Guardamos el status original para que HTTP no tape la señal real del fallo.
  error.status = status;

  return error;
}

function normalizeCompanies(body) {
  // Auth puede responder con distintos envelopes; reportes los aplana antes de agregar.
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

function normalizeDebts(body) {
  // Deudas también puede venir envuelto; normalizamos para mantener puro el cálculo.
  if (Array.isArray(body)) {
    return body;
  }

  if (Array.isArray(body?.data)) {
    return body.data;
  }

  return [];
}

function buildCompanySummary(company, debts) {
  // Slice 1: cruza empresas y deudas para entregar una foto ejecutiva por tenant.
  const companyDebts = debts.filter(
    (debt) => String(debt.tenant_id) === String(company.id),
  );

  const totalDebts = companyDebts.length;
  const pendingDebts = companyDebts.filter((debt) => debt.status === "PENDING");
  const paidDebts = companyDebts.filter((debt) => debt.status === "PAID");
  const cancelledDebts = companyDebts.filter(
    (debt) => debt.status === "CANCELLED",
  );

  const pendingAmount = pendingDebts.reduce((total, debt) => {
    return total + Number(debt.amount || 0);
  }, 0);

  return {
    company_id: company.id,
    company_name: company.name,
    company_status: company.status,
    company_active: company.active,
    total_debts: totalDebts,
    pending_debts: pendingDebts.length,
    paid_debts: paidDebts.length,
    cancelled_debts: cancelledDebts.length,
    pending_amount: pendingAmount,
  };
}

export class GetCompanyPortfolioSummaryHandler {
  constructor({
    fetchCompaniesFn = fetchCompanies,
    fetchDebtsFn = fetchDebts,
  } = {}) {
    this.fetchCompaniesFn = fetchCompaniesFn;
    this.fetchDebtsFn = fetchDebtsFn;
  }

  async execute(query) {
    // Primero pedimos empresas a auth porque ese servicio define qué compañías puede ver el admin.
    const companiesResult = await this.fetchCompaniesFn({
      authorization: query.authorization,
    });

    if (!companiesResult.ok) {
      throw createUpstreamError(
        companiesResult.body?.detail ||
          "No se pudo obtener la lista de empresas.",
        companiesResult.status,
      );
    }

    // Luego consultamos cartera en deudas y hacemos el cruce dentro de reportes.
    const debtsResult = await this.fetchDebtsFn();

    if (!debtsResult.ok) {
      throw createUpstreamError(
        debtsResult.body?.detail || "No se pudo obtener la lista de deudas.",
        debtsResult.status,
      );
    }

    const companies = normalizeCompanies(companiesResult.body);
    const debts = normalizeDebts(debtsResult.body);

    // Si auth resolvió un `companyId`, reducimos la foto a esa empresa sin alterar la lógica agregada.
    const filteredCompanies = query.companyId
      ? companies.filter((company) => String(company.id) === String(query.companyId))
      : companies;

    return filteredCompanies.map((company) => buildCompanySummary(company, debts));
  }
}
