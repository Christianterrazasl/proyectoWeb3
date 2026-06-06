import { fetchAdminServices } from "../../infrastructure/catalog/serviceClient.js";
import { fetchDebts } from "../../infrastructure/debts/debtClient.js";

function createUpstreamError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizeServices(body) {
  // Catálogo puede responder lista plana o envuelta; el KPI trabaja siempre sobre arrays simples.
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
  // Homologamos el shape de deudas para que el cálculo no dependa del transporte HTTP.
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

function normalizeStatus(rawStatus) {
  return String(rawStatus || "").trim().toUpperCase();
}

function readServiceField(service, camelKey, snakeKey) {
  // Slice 2 convive con proyecciones camelCase y snake_case según el origen del dato.
  return service?.[camelKey] ?? service?.[snakeKey] ?? null;
}

function buildServiceKpi(service, debts) {
  // Cada fila resume salud operativa y financiera de un servicio dentro de su empresa.
  const companyId = readServiceField(service, "companyId", "company_id");
  const serviceId = readServiceField(service, "serviceId", "service_id");

  const serviceDebts = debts.filter(
    (debt) =>
      String(debt.tenant_id) === String(companyId) &&
      String(debt.service_id) === String(serviceId),
  );

  const totalDebts = serviceDebts.length;
  const pendingDebts = serviceDebts.filter(
    (debt) => normalizeStatus(debt.status) === "PENDING",
  );
  const paidDebts = serviceDebts.filter(
    (debt) => normalizeStatus(debt.status) === "PAID",
  );
  const cancelledDebts = serviceDebts.filter(
    (debt) => normalizeStatus(debt.status) === "CANCELLED",
  );

  const pendingAmount = pendingDebts.reduce((total, debt) => {
    return total + Number(debt.amount || 0);
  }, 0);

  return {
    service_id: serviceId,
    service_name: readServiceField(service, "serviceName", "service_name"),
    company_id: companyId,
    company_name: readServiceField(service, "companyName", "company_name"),
    is_published:
      readServiceField(service, "isPublished", "is_published") ?? false,
    total_debts: totalDebts,
    pending_debts: pendingDebts.length,
    paid_debts: paidDebts.length,
    cancelled_debts: cancelledDebts.length,
    pending_amount: pendingAmount,
  };
}

export class GetServiceKpiReportHandler {
  constructor({
    fetchAdminServicesFn = fetchAdminServices,
    fetchDebtsFn = fetchDebts,
  } = {}) {
    this.fetchAdminServicesFn = fetchAdminServicesFn;
    this.fetchDebtsFn = fetchDebtsFn;
  }

  async execute(query) {
    // El KPI cruza catálogo (qué servicios existen) con deudas (qué pasó con cada cobro).
    // Así el ownership sigue repartido por dominio y reportes solo agrega lectura admin.
    const servicesResult = await this.fetchAdminServicesFn({
      authorization: query.authorization,
      companyId: query.companyId,
    });

    if (!servicesResult.ok) {
      throw createUpstreamError(
        servicesResult.body?.detail ||
          servicesResult.body?.message ||
          "No se pudo obtener la lista de servicios administrativos.",
        servicesResult.status,
      );
    }

    // Si la sesión viene scopiada, ese mismo alcance se replica al consultar cartera.
    const debtsResult = await this.fetchDebtsFn({
      tenantId: query.companyId,
    });

    if (!debtsResult.ok) {
      throw createUpstreamError(
        debtsResult.body?.detail ||
          debtsResult.body?.message ||
          "No se pudo obtener la lista de deudas.",
        debtsResult.status,
      );
    }

    const services = normalizeServices(servicesResult.body);
    const debts = normalizeDebts(debtsResult.body);

    return services.map((service) => buildServiceKpi(service, debts));
  }
}

