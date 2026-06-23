import test from "node:test";
import assert from "node:assert/strict";

import { createTransactionClient } from "../src/infrastructure/payments/transactionClient.js";

test("createTransactionClient usa el listado real de pagos y propaga filtros", async () => {
  let capturedUrl = null;
  let capturedOptions = null;

  const client = createTransactionClient({
    fetchImpl: async (url, options) => {
      capturedUrl = url;
      capturedOptions = options;

      return {
        ok: true,
        status: 200,
        json: async () => ({ data: [] }),
      };
    },
  });

  const result = await client({
    authorization: "Bearer test-token",
    tenant_id: "empresa-1",
    service_id: "svc-9",
    status: "SUCCESS",
    customer_ref: "C-100",
    from: "2026-06-01T00:00:00.000Z",
    to: "2026-06-22T23:59:59.999Z",
  });

  assert.equal(result.ok, true);
  assert.equal(capturedUrl.pathname, "/api/payments");
  assert.equal(capturedUrl.searchParams.get("tenant_id"), "empresa-1");
  assert.equal(capturedUrl.searchParams.get("service_id"), "svc-9");
  assert.equal(capturedUrl.searchParams.get("status"), "SUCCESS");
  assert.equal(capturedUrl.searchParams.get("customer_ref"), "C-100");
  assert.equal(capturedUrl.searchParams.get("from"), "2026-06-01T00:00:00.000Z");
  assert.equal(capturedUrl.searchParams.get("to"), "2026-06-22T23:59:59.999Z");
  assert.deepEqual(capturedOptions, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer test-token",
    },
  });
});

test("createTransactionClient conserva compatibilidad con el alias configurado", async () => {
  let capturedUrl = null;

  const client = createTransactionClient({
    transactionsUrl: "http://pagos:3000/api/payments/admin/transactions",
    fetchImpl: async (url) => {
      capturedUrl = url;

      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            {
              id: "txn-9",
              debt_id: 99,
              tenant_id: "empresa-7",
              service_id: "svc-4",
              customer_ref: "C-700",
              amount: 15,
              status: "PENDING",
              created_at: "2026-06-22T08:00:00.000Z",
              receipt_hash: null,
            },
          ],
        }),
      };
    },
  });

  const result = await client({
    authorization: "Bearer otro-token",
    tenant_id: "empresa-7",
  });

  assert.equal(result.ok, true);
  assert.equal(capturedUrl.pathname, "/api/payments/admin/transactions");
  assert.equal(capturedUrl.searchParams.get("tenant_id"), "empresa-7");
  assert.deepEqual(result.body, {
    data: [
      {
        id: "txn-9",
        debt_id: 99,
        tenant_id: "empresa-7",
        service_id: "svc-4",
        customer_ref: "C-700",
        amount: 15,
        status: "PENDING",
        created_at: "2026-06-22T08:00:00.000Z",
        receipt_hash: null,
      },
    ],
  });
});
