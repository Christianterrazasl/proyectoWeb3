import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAuditLogsQuery,
  buildCompanyPortfolioQuery,
  buildDashboardSummaryQuery,
  buildTransactionMonitoringQuery,
  resolveScopedCompanyId,
} from "../src/api/controllers/shared/reportRequestBuilders.js";

function createRequest({ headers = {}, query = {}, companyId = null } = {}) {
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );

  return {
    query,
    companyId,
    header(name) {
      return normalizedHeaders[name.toLowerCase()];
    },
  };
}

test("resolveScopedCompanyId solo aplica scope cuando llega el header", () => {
  assert.equal(resolveScopedCompanyId(createRequest({ companyId: 44 })), null);
  assert.equal(
    resolveScopedCompanyId(
      createRequest({
        headers: { "x-company-id": "44" },
        companyId: 44,
      }),
    ),
    44,
  );
});

test("los builders de reportes convierten request HTTP en queries del caso de uso", () => {
  const req = createRequest({
    headers: {
      authorization: "Bearer token",
      "x-company-id": "91",
    },
    query: {
      tenant_id: "tenant-2",
      service_id: "service-4",
      status: "pending",
      customer_ref: "cus-8",
      from: "2026-04-01",
      to: "2026-04-30",
      action: "view_audit_logs",
      company_id: "500",
      actor_user_id: "17",
      resource_type: "audit_log",
    },
    companyId: 91,
  });

  const portfolioQuery = buildCompanyPortfolioQuery(req);
  const transactionQuery = buildTransactionMonitoringQuery(req);
  const dashboardQuery = buildDashboardSummaryQuery(req);
  const auditLogsQuery = buildAuditLogsQuery(req);

  assert.equal(portfolioQuery.authorization, "Bearer token");
  assert.equal(portfolioQuery.companyId, 91);
  assert.equal(transactionQuery.tenantId, "tenant-2");
  assert.equal(transactionQuery.serviceId, "service-4");
  assert.equal(transactionQuery.status, "pending");
  assert.equal(transactionQuery.customerRef, "cus-8");
  assert.equal(transactionQuery.from, "2026-04-01");
  assert.equal(transactionQuery.to, "2026-04-30");
  assert.equal(dashboardQuery.from, "2026-04-01");
  assert.equal(dashboardQuery.to, "2026-04-30");
  assert.equal(auditLogsQuery.action, "view_audit_logs");
  assert.equal(auditLogsQuery.companyId, 91);
  assert.equal(auditLogsQuery.actorUserId, "17");
  assert.equal(auditLogsQuery.resourceType, "audit_log");
});
