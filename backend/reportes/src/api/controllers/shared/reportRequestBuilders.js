import { GetCompanyPortfolioSummaryQuery } from "../../../application/queries/GetCompanyPortfolioSummaryQuery.js";
import { GetServiceKpiReportQuery } from "../../../application/queries/GetServiceKpiReportQuery.js";
import { GetTransactionMonitoringQuery } from "../../../application/queries/GetTransactionMonitoringQuery.js";
import { GetDashboardSummaryQuery } from "../../../application/queries/GetDashboardSummaryQuery.js";
import { GetAuditLogsQuery } from "../../../application/queries/GetAuditLogsQuery.js";

/**
 * Si el admin manda X-Company-Id, usamos el scope ya validado por auth.
 * Si no lo manda, la lectura/exportación será global.
 */
export function resolveScopedCompanyId(req) {
  return req.header("x-company-id") ? req.companyId : null;
}

export function buildCompanyPortfolioQuery(req) {
  return new GetCompanyPortfolioSummaryQuery({
    authorization: req.header("authorization"),
    companyId: resolveScopedCompanyId(req),
  });
}

export function buildServiceKpiQuery(req) {
  return new GetServiceKpiReportQuery({
    authorization: req.header("authorization"),
    companyId: resolveScopedCompanyId(req),
  });
}

export function buildTransactionMonitoringQuery(req) {
  return new GetTransactionMonitoringQuery({
    authorization: req.header("authorization"),
    companyId: resolveScopedCompanyId(req),
    tenantId: req.query.tenant_id,
    serviceId: req.query.service_id,
    status: req.query.status,
    customerRef: req.query.customer_ref,
    from: req.query.from,
    to: req.query.to,
  });
}

export function buildDashboardSummaryQuery(req) {
  return new GetDashboardSummaryQuery({
    authorization: req.header("authorization"),
    companyId: resolveScopedCompanyId(req),
    from: req.query.from,
    to: req.query.to,
  });
}

export function buildAuditLogsQuery(req) {
  const scopedCompanyId = resolveScopedCompanyId(req);
  const requestedCompanyId = scopedCompanyId ?? req.query.company_id ?? null;

  return new GetAuditLogsQuery({
    action: req.query.action,
    companyId: requestedCompanyId,
    actorUserId: req.query.actor_user_id,
    resourceType: req.query.resource_type,
    from: req.query.from,
    to: req.query.to,
  });
}
