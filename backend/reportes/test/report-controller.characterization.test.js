import test from "node:test";
import assert from "node:assert/strict";

import { GetCompanyPortfolioSummaryQuery } from "../src/application/queries/GetCompanyPortfolioSummaryQuery.js";
import { GetTransactionMonitoringQuery } from "../src/application/queries/GetTransactionMonitoringQuery.js";
import { GetAuditLogsQuery } from "../src/application/queries/GetAuditLogsQuery.js";
import { ReportController } from "../src/api/controllers/ReportController.js";

function createRequest({ headers = {}, query = {}, authContext = null, companyId = null } = {}) {
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );

  return {
    query,
    authContext,
    companyId,
    header(name) {
      return normalizedHeaders[name.toLowerCase()];
    },
  };
}

function createResponse() {
  return {
    statusCode: null,
    headers: {},
    jsonBody: null,
    sentBody: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    json(body) {
      this.jsonBody = body;
      return this;
    },
    send(body) {
      this.sentBody = body;
      return this;
    },
  };
}

function createController(overrides = {}) {
  return new ReportController(
    overrides.portfolioSummaryHandler ?? { execute: async () => [] },
    overrides.serviceKpiReportHandler ?? { execute: async () => [] },
    overrides.transactionMonitoringHandler ?? { execute: async () => [] },
    overrides.dashboardSummaryHandler ?? { execute: async () => ({}) },
    overrides.registerAuditLogHandler ?? { execute: async () => undefined },
    overrides.getAuditLogsHandler ?? { execute: async () => [] },
  );
}

test("buildCompanyPortfolioQuery usa authorization y scope resuelto", () => {
  const controller = createController();
  const scopedRequest = createRequest({
    headers: {
      authorization: "Bearer token",
      "x-company-id": "25",
    },
    companyId: 25,
  });
  const globalRequest = createRequest({
    headers: {
      authorization: "Bearer token",
    },
    companyId: 999,
  });

  const scopedQuery = controller.buildCompanyPortfolioQuery(scopedRequest);
  const globalQuery = controller.buildCompanyPortfolioQuery(globalRequest);

  assert.ok(scopedQuery instanceof GetCompanyPortfolioSummaryQuery);
  assert.equal(scopedQuery.authorization, "Bearer token");
  assert.equal(scopedQuery.companyId, 25);
  assert.equal(globalQuery.companyId, null);
});

test("getCompanyPortfolioSummary responde JSON y registra auditoria", async () => {
  const rows = [{ company_id: 1 }, { company_id: 2 }];
  const auditCommands = [];
  const controller = createController({
    portfolioSummaryHandler: {
      execute: async (query) => {
        assert.equal(query.authorization, "Bearer token");
        assert.equal(query.companyId, 77);
        return rows;
      },
    },
    registerAuditLogHandler: {
      execute: async (command) => {
        auditCommands.push(command);
      },
    },
  });
  const req = createRequest({
    headers: {
      authorization: "Bearer token",
      "x-company-id": "77",
    },
    authContext: {
      user: {
        id: 9,
        email: "admin@example.com",
      },
    },
    companyId: 77,
  });
  const res = createResponse();

  await controller.getCompanyPortfolioSummary(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.jsonBody, {
    success: true,
    data: rows,
  });
  assert.equal(auditCommands.length, 1);
  assert.equal(auditCommands[0].action, "view_company_portfolio_summary");
  assert.equal(auditCommands[0].actorUserId, 9);
  assert.equal(auditCommands[0].actorEmail, "admin@example.com");
  assert.equal(auditCommands[0].companyId, 77);
  assert.deepEqual(auditCommands[0].metadata, { row_count: 2 });
});

test("getDashboardSummary mantiene respuesta si la auditoria falla", async () => {
  const result = { pendingDebts: 10 };
  const controller = createController({
    dashboardSummaryHandler: {
      execute: async (query) => {
        assert.equal(query.authorization, "Bearer token");
        assert.equal(query.companyId, 11);
        assert.equal(query.from, "2026-01-01");
        assert.equal(query.to, "2026-01-31");
        return result;
      },
    },
    registerAuditLogHandler: {
      execute: async () => {
        throw new Error("audit-store-down");
      },
    },
  });
  const req = createRequest({
    headers: {
      authorization: "Bearer token",
      "x-company-id": "11",
    },
    query: {
      from: "2026-01-01",
      to: "2026-01-31",
    },
    companyId: 11,
  });
  const res = createResponse();

  await controller.getDashboardSummary(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.jsonBody, {
    success: true,
    data: result,
  });
});

test("exportTransactionsXlsx conserva headers de descarga y filtros de auditoria", async () => {
  const rows = [{ transaction_id: "trx-1", amount: 1500 }];
  const auditCommands = [];
  const controller = createController({
    transactionMonitoringHandler: {
      execute: async (query) => {
        assert.ok(query instanceof GetTransactionMonitoringQuery);
        assert.equal(query.companyId, 34);
        assert.equal(query.tenantId, "tenant-1");
        assert.equal(query.serviceId, "service-9");
        assert.equal(query.status, "paid");
        assert.equal(query.customerRef, "ref-22");
        assert.equal(query.from, "2026-02-01");
        assert.equal(query.to, "2026-02-28");
        return rows;
      },
    },
    registerAuditLogHandler: {
      execute: async (command) => {
        auditCommands.push(command);
      },
    },
  });
  const req = createRequest({
    headers: {
      authorization: "Bearer token",
      "x-company-id": "34",
    },
    query: {
      tenant_id: "tenant-1",
      service_id: "service-9",
      status: "paid",
      customer_ref: "ref-22",
      from: "2026-02-01",
      to: "2026-02-28",
    },
    companyId: 34,
  });
  const res = createResponse();

  await controller.exportTransactionsXlsx(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(
    res.headers["Content-Type"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  assert.equal(
    res.headers["Content-Disposition"],
    'attachment; filename="transactions-monitoring.xlsx"',
  );
  assert.ok(Buffer.isBuffer(res.sentBody));
  assert.deepEqual(auditCommands[0].metadata, {
    format: "xlsx",
    tenant_id: "tenant-1",
    service_id: "service-9",
    status: "paid",
    customer_ref: "ref-22",
    from: "2026-02-01",
    to: "2026-02-28",
    row_count: 1,
  });
});

test("getAuditLogs prioriza el scope resuelto sobre company_id del query string", async () => {
  const controller = createController({
    getAuditLogsHandler: {
      execute: async (query) => {
        assert.ok(query instanceof GetAuditLogsQuery);
        assert.equal(query.companyId, 52);
        assert.equal(query.action, "view_dashboard_summary");
        assert.equal(query.actorUserId, "14");
        assert.equal(query.resourceType, "dashboard");
        assert.equal(query.from, "2026-03-01");
        assert.equal(query.to, "2026-03-31");
        return [{ id: 1 }];
      },
    },
  });
  const req = createRequest({
    headers: {
      authorization: "Bearer token",
      "x-company-id": "52",
    },
    query: {
      company_id: "999",
      action: "view_dashboard_summary",
      actor_user_id: "14",
      resource_type: "dashboard",
      from: "2026-03-01",
      to: "2026-03-31",
    },
    companyId: 52,
  });
  const res = createResponse();

  await controller.getAuditLogs(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.jsonBody, {
    success: true,
    data: [{ id: 1 }],
  });
});
