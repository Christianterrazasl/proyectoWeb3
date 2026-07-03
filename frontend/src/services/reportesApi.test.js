import test from "node:test";
import assert from "node:assert/strict";

import {
  downloadAdminCompaniesCsv,
  downloadAdminCompaniesXlsx,
  downloadAdminServicesCsv,
  downloadAdminServicesXlsx,
  downloadAdminTransactionsCsv,
  downloadAdminTransactionsXlsx,
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

test("admin export helpers download all real CSV/XLSX endpoints with auth and company scope", async () => {
  const calls = [];
  const createdAnchors = [];
  const createdUrls = [];
  const revokedUrls = [];

  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });

    return new Response(`file for ${url}`, {
      status: 200,
      headers: {
        "content-type": url.endsWith(".xlsx")
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${url.split("/").at(-1)}"`,
      },
    });
  };

  globalThis.URL = {
    createObjectURL(blob) {
      createdUrls.push(blob.size);
      return `blob:${createdUrls.length}`;
    },
    revokeObjectURL(url) {
      revokedUrls.push(url);
    },
  };

  globalThis.document = {
    createElement(tagName) {
      const anchor = {
        tagName,
        href: "",
        download: "",
        clickCount: 0,
        click() {
          this.clickCount += 1;
        },
      };
      createdAnchors.push(anchor);
      return anchor;
    },
  };

  await Promise.all([
    downloadAdminCompaniesCsv("token-123", 42),
    downloadAdminCompaniesXlsx("token-123", 42),
    downloadAdminServicesCsv("token-123", 42),
    downloadAdminServicesXlsx("token-123", 42),
    downloadAdminTransactionsCsv("token-123", 42),
    downloadAdminTransactionsXlsx("token-123", 42),
  ]);

  assert.deepEqual(
    calls.map((call) => call.url),
    [
      "/api/admin/exports/companies.csv",
      "/api/admin/exports/companies.xlsx",
      "/api/admin/exports/services.csv",
      "/api/admin/exports/services.xlsx",
      "/api/admin/exports/transactions.csv",
      "/api/admin/exports/transactions.xlsx",
    ],
  );

  for (const call of calls) {
    assert.equal(call.init.method, "GET");
    assert.equal(call.init.headers.Authorization, "Bearer token-123");
    assert.equal(call.init.headers["X-Company-Id"], "42");
  }

  assert.equal(createdAnchors.length, 6);
  assert.deepEqual(
    createdAnchors.map((anchor) => anchor.download),
    [
      "companies.csv",
      "companies.xlsx",
      "services.csv",
      "services.xlsx",
      "transactions.csv",
      "transactions.xlsx",
    ],
  );
  assert.deepEqual(createdAnchors.map((anchor) => anchor.clickCount), [1, 1, 1, 1, 1, 1]);
  assert.deepEqual(revokedUrls, ["blob:1", "blob:2", "blob:3", "blob:4", "blob:5", "blob:6"]);
});

test("admin export helpers surface backend failures and empty downloads truthfully", async () => {
  let requestCount = 0;

  globalThis.fetch = async () => {
    requestCount += 1;

    if (requestCount === 1) {
      return new Response(JSON.stringify({ message: "No hay empresas exportables" }), {
        status: 404,
        headers: {
          "content-type": "application/json",
        },
      });
    }

    return new Response("", {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="services.csv"',
      },
    });
  };

  globalThis.URL = {
    createObjectURL() {
      throw new Error("No debe intentar descargar un blob vacío");
    },
    revokeObjectURL() {},
  };

  globalThis.document = {
    createElement() {
      throw new Error("No debe crear anchors cuando la exportación falla");
    },
  };

  await assert.rejects(
    async () => downloadAdminCompaniesCsv("token-123", 42),
    /no hay empresas exportables/i,
  );

  await assert.rejects(
    async () => downloadAdminServicesCsv("token-123", 42),
    /no devolvió datos/i,
  );
});
