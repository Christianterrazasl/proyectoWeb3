import test from "node:test";
import assert from "node:assert/strict";

import { GetDashboardSummaryHandler } from "../src/application/handlers/GetDashboardSummaryHandler.js";

function ok(body) {
  return { ok: true, status: 200, body };
}

test("GetDashboardSummaryHandler scopes summary to selected company", async () => {
  const handler = new GetDashboardSummaryHandler({
    fetchCompaniesFn: async () =>
      ok([
        { id: 42, active: true },
        { id: 99, active: true },
      ]),
    fetchAdminServicesFn: async () =>
      ok([
        { companyId: 42, isPublished: true },
        { companyId: 99, isPublished: false },
      ]),
    fetchDebtsFn: async () =>
      ok([
        { tenant_id: 42, status: "PENDING", amount: 120 },
        { tenant_id: 99, status: "PENDING", amount: 300 },
      ]),
    fetchAdminTransactionsFn: async () =>
      ok([
        { tenant_id: 42, status: "SUCCESS" },
        { tenant_id: 99, status: "FAILED" },
      ]),
  });

  const scopedSummary = await handler.execute({
    authorization: "Bearer token-123",
    companyId: 42,
    from: null,
    to: null,
  });

  assert.deepEqual(scopedSummary, {
    company_scope: 42,
    total_companies: 1,
    active_companies: 1,
    total_services: 1,
    published_services: 1,
    total_debts: 1,
    pending_debts: 1,
    pending_amount: 120,
    total_transactions: 1,
    successful_transactions: 1,
    failed_transactions: 0,
    pending_transactions: 0,
    approval_rate: 100,
  });
});

test("GetDashboardSummaryHandler keeps global summary when no company is selected", async () => {
  const handler = new GetDashboardSummaryHandler({
    fetchCompaniesFn: async () => ok([{ id: 42, active: true }, { id: 99, active: false }]),
    fetchAdminServicesFn: async () => ok([{ companyId: 42, isPublished: true }, { companyId: 99, isPublished: false }]),
    fetchDebtsFn: async () => ok([{ tenant_id: 42, status: "PENDING", amount: 120 }, { tenant_id: 99, status: "PAID", amount: 300 }]),
    fetchAdminTransactionsFn: async () => ok([{ tenant_id: 42, status: "SUCCESS" }, { tenant_id: 99, status: "FAILED" }]),
  });

  const globalSummary = await handler.execute({
    authorization: "Bearer token-123",
    companyId: null,
    from: null,
    to: null,
  });

  assert.equal(globalSummary.company_scope, null);
  assert.equal(globalSummary.total_companies, 2);
  assert.equal(globalSummary.total_services, 2);
  assert.equal(globalSummary.total_debts, 2);
  assert.equal(globalSummary.total_transactions, 2);
  assert.equal(globalSummary.approval_rate, 50);
});
