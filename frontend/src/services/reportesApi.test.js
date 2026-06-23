import test from "node:test";
import assert from "node:assert/strict";

import {
  getAuditLogs,
  getCompanyPortfolioSummary,
  getDashboardSummary,
  getServiceKpis,
  getTransactionMonitoring,
} from "./reportesApi.js";

test("getDashboardSummary forwards X-Company-Id when company is selected", async () => {
  let requestUrl = null;
  let requestInit = null;

  globalThis.fetch = async (url, init) => {
    requestUrl = url;
    requestInit = init;

    return new Response(JSON.stringify({ data: { company_scope: 42 } }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
  };

  const summary = await getDashboardSummary("token-123", 42);

  assert.equal(requestUrl, "/api/admin/dashboard/summary");
  assert.equal(requestInit.method, "GET");
  assert.equal(requestInit.headers.Authorization, "Bearer token-123");
  assert.equal(requestInit.headers["X-Company-Id"], "42");
  assert.equal(summary.company_scope, 42);
});

test("getDashboardSummary omits X-Company-Id when no company is selected", async () => {
  let requestInit = null;

  globalThis.fetch = async (_url, init) => {
    requestInit = init;

    return new Response(JSON.stringify({ data: { company_scope: null } }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
  };

  await getDashboardSummary("token-123", null);

  assert.equal(requestInit.headers.Authorization, "Bearer token-123");
  assert.equal("X-Company-Id" in requestInit.headers, false);
});

test("reportesApi reads real admin report endpoints through the shared helper", async () => {
  const calls = [];

  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });

    return new Response(JSON.stringify({ data: [{ ok: true, path: url }] }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
  };

  const [portfolio, services, transactions, auditLogs] = await Promise.all([
    getCompanyPortfolioSummary("token-123", 42),
    getServiceKpis("token-123", 42),
    getTransactionMonitoring("token-123", 42),
    getAuditLogs("token-123", 42),
  ]);

  assert.deepEqual(
    calls.map((call) => call.url),
    [
      "/api/admin/reports/companies/portfolio-summary",
      "/api/admin/reports/services/kpis",
      "/api/admin/reports/transactions/monitoring",
      "/api/admin/audit-logs",
    ],
  );

  for (const call of calls) {
    assert.equal(call.init.method, "GET");
    assert.equal(call.init.headers.Authorization, "Bearer token-123");
    assert.equal(call.init.headers["X-Company-Id"], "42");
  }

  assert.equal(portfolio[0].path, "/api/admin/reports/companies/portfolio-summary");
  assert.equal(services[0].path, "/api/admin/reports/services/kpis");
  assert.equal(transactions[0].path, "/api/admin/reports/transactions/monitoring");
  assert.equal(auditLogs[0].path, "/api/admin/audit-logs");
});
