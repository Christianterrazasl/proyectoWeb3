import test from "node:test";
import assert from "node:assert/strict";

import {
  getAdminDebtsUrl,
  getProviderCustomerDebts,
  listProviderDebts,
} from "./deudasApi.js";

test("getProviderCustomerDebts preserves customerRef characters accepted by lookup", async () => {
  let requestUrl = null;

  globalThis.fetch = async (url) => {
    requestUrl = url;

    return new Response(JSON.stringify({ data: { debts: [] } }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
  };

  await getProviderCustomerDebts("1", "123 456");

  assert.equal(requestUrl, "/debts/providers/1/customers/123%20456");
});

test("getAdminDebtsUrl keeps provider debt requests under the gateway route", () => {
  globalThis.window = {
    location: {
      origin: "http://localhost:5173",
    },
  };

  assert.equal(getAdminDebtsUrl(), "/api/admin/debts");
  assert.equal(getAdminDebtsUrl("PENDING"), "/api/admin/debts?status=PENDING");
});

test("listProviderDebts forwards auth headers and uses the admin debts gateway path", async () => {
  globalThis.window = {
    location: {
      origin: "http://localhost:5173",
    },
  };

  let requestUrl = null;
  let requestInit = null;

  globalThis.fetch = async (url, init) => {
    requestUrl = url;
    requestInit = init;

    return new Response(JSON.stringify({ data: [] }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
  };

  await listProviderDebts({
    accessToken: "token-123",
    companyId: 42,
    status: "PENDING",
  });

  assert.equal(requestUrl, "/api/admin/debts?status=PENDING");
  assert.equal(requestInit.headers.Authorization, "Bearer token-123");
  assert.equal(requestInit.headers["X-Company-Id"], "42");
});
