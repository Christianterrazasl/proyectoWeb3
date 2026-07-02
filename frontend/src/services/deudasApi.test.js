import test from "node:test";
import assert from "node:assert/strict";

import {
  createProviderDebt,
  getAdminDebtsUrl,
  getProviderCustomerDebts,
  listProviderDebts,
  searchDebtsLookup,
} from "./deudasApi.js";

test("searchDebtsLookup maps 404 responses to a typed error", async () => {
  globalThis.window = {
    location: {
      origin: "http://localhost:5173",
    },
  };

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        success: false,
        message: "No se encontraron deudas pendientes para los datos proporcionados",
      }),
      {
        status: 404,
        headers: {
          "content-type": "application/json",
        },
      },
    );

  await assert.rejects(
    async () => searchDebtsLookup("1", "agua-residencial", "1234567"),
    (error) => {
      assert.equal(error.status, 404);
      assert.match(error.message, /deudas pendientes/i);
      return true;
    },
  );
});

test("searchDebtsLookup returns pending debts from lookup payload", async () => {
  globalThis.window = {
    location: {
      origin: "http://localhost:5173",
    },
  };

  globalThis.fetch = async (url) => {
    assert.equal(
      url,
      "/debts/lookup?tenantId=1&serviceId=agua-residencial&customerRef=1234567",
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: [
          {
            id: "7",
            serviceId: "prueba2",
            period: "2030-12",
            amount: 500,
            status: "PENDING",
          },
        ],
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  };

  const debts = await searchDebtsLookup("1", "agua-residencial", "1234567");

  assert.equal(debts.length, 1);
  assert.equal(debts[0].serviceId, "prueba2");
});

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

test("createProviderDebt posts admin debt payload with auth and tenant context", async () => {
  let requestUrl = null;
  let requestInit = null;

  globalThis.fetch = async (url, init) => {
    requestUrl = url;
    requestInit = init;

    return new Response(JSON.stringify({ data: { id: 99 } }), {
      status: 201,
      headers: {
        "content-type": "application/json",
      },
    });
  };

  const result = await createProviderDebt({
    accessToken: "token-xyz",
    companyId: 55,
    tenantId: "55",
    serviceId: "mensualidad_vip",
    customerRef: "1234567",
    period: "2026-07",
    amount: "250.50",
    dueDate: "2026-07-15T00:00:00.000Z",
  });

  assert.equal(requestUrl, "/api/admin/debts");
  assert.equal(requestInit.method, "POST");
  assert.equal(requestInit.headers.Authorization, "Bearer token-xyz");
  assert.equal(requestInit.headers["X-Company-Id"], "55");
  assert.deepEqual(JSON.parse(requestInit.body), {
    tenantId: "55",
    serviceId: "mensualidad_vip",
    customerRef: "1234567",
    period: "2026-07",
    amount: 250.5,
    dueDate: "2026-07-15T00:00:00.000Z",
  });
  assert.deepEqual(result, { id: 99 });
});
