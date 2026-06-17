import test from "node:test";
import assert from "node:assert/strict";

import { createReportRouter } from "../src/api/routes/report.routes.js";

const ROUTE_EXPECTATIONS = [
  {
    path: "/admin/reports/companies/portfolio-summary",
    methodName: "getCompanyPortfolioSummary",
  },
  {
    path: "/admin/reports/services/kpis",
    methodName: "getServiceKpiReport",
  },
  {
    path: "/admin/reports/transactions/monitoring",
    methodName: "getTransactionMonitoring",
  },
  {
    path: "/admin/dashboard/summary",
    methodName: "getDashboardSummary",
  },
  {
    path: "/admin/exports/companies.csv",
    methodName: "exportCompaniesCsv",
  },
  {
    path: "/admin/exports/companies.xlsx",
    methodName: "exportCompaniesXlsx",
  },
  {
    path: "/admin/exports/services.csv",
    methodName: "exportServicesCsv",
  },
  {
    path: "/admin/exports/services.xlsx",
    methodName: "exportServicesXlsx",
  },
  {
    path: "/admin/exports/transactions.csv",
    methodName: "exportTransactionsCsv",
  },
  {
    path: "/admin/exports/transactions.xlsx",
    methodName: "exportTransactionsXlsx",
  },
  {
    path: "/admin/audit-logs",
    methodName: "getAuditLogs",
  },
];

test("createReportRouter conserva todas las rutas GET y el middleware admin", async () => {
  const invokedMethods = [];
  const middleware = () => undefined;
  const controller = Object.fromEntries(
    ROUTE_EXPECTATIONS.map(({ methodName }) => [
      methodName,
      async (req, res) => {
        invokedMethods.push(methodName);
        return { req, res };
      },
    ]),
  );
  const router = createReportRouter({
    controller,
    requireAdminSessionMiddleware: middleware,
  });

  const routes = router.stack
    .filter((layer) => layer.route)
    .map((layer) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods),
      handlers: layer.route.stack.map((handlerLayer) => handlerLayer.handle),
    }));

  assert.equal(routes.length, ROUTE_EXPECTATIONS.length);

  for (const expectation of ROUTE_EXPECTATIONS) {
    const route = routes.find((candidate) => candidate.path === expectation.path);

    assert.ok(route, `Falta la ruta ${expectation.path}`);
    assert.deepEqual(route.methods, ["get"]);
    assert.equal(route.handlers[0], middleware);

    await route.handlers[1]({ route: expectation.path }, { ok: true });
  }

  assert.deepEqual(
    invokedMethods,
    ROUTE_EXPECTATIONS.map(({ methodName }) => methodName),
  );
});
