const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { createApp } = require("../app");

test("GET /debts/providers/:tenantId/customers/:customerRef returns scoped public debt detail", async () => {
  let providerQuery = null;
  let debtQuery = null;

  const app = createApp({
    prismaClient: {
      provider: {
        findMany: async () => [],
        findUnique: async (query) => {
          providerQuery = query;
          return {
            id: 7,
            tenant_id: "1",
            name: "Nur",
            description: "Pago de servicios",
            image_url: "https://placehold.net/1.png",
            active: true,
          };
        },
      },
      debt: {
        findMany: async (query) => {
          debtQuery = query;
          return [
            {
              id: 11,
              tenant_id: "1",
              service_id: "agua-residencial",
              customer_ref: "1234567",
              period: "2026-03",
              amount: 85.5,
              due_date: new Date("2026-04-15T00:00:00.000Z"),
              status: "PENDING",
            },
          ];
        },
      },
    },
  });

  const response = await request(app).get("/debts/providers/1/customers/1234567");

  assert.equal(response.status, 200);
  assert.deepEqual(providerQuery, { where: { tenant_id: "1" } });
  assert.deepEqual(debtQuery, {
    where: {
      tenant_id: "1",
      customer_ref: "1234567",
      status: "PENDING",
    },
    orderBy: { due_date: "asc" },
  });
  assert.equal(response.body.success, true);
  assert.deepEqual(response.body.data, {
    provider: {
      id: "7",
      name: "Nur",
      description: "Pago de servicios",
      image: "https://placehold.net/1.png",
      idProveedor: "1",
      tenantId: "1",
      active: true,
    },
    customerRef: "1234567",
    debts: [
      {
        id: "11",
        serviceId: "agua-residencial",
        period: "2026-03",
        amount: 85.5,
        dueDate: "2026-04-15T00:00:00.000Z",
        status: "PENDING",
      },
    ],
  });
  assert.deepEqual(response.body.meta, {
    tenantId: "1",
    totalDebts: 1,
  });
});

test("GET /debts/providers/:tenantId/customers/:customerRef accepts customerRef values already accepted by lookup", async () => {
  let debtQuery = null;

  const app = createApp({
    prismaClient: {
      provider: {
        findMany: async () => [],
        findUnique: async () => ({
          id: 7,
          tenant_id: "1",
          name: "Nur",
          description: "Pago de servicios",
          image_url: "https://placehold.net/1.png",
          active: true,
        }),
      },
      debt: {
        findMany: async (query) => {
          debtQuery = query;
          return [];
        },
      },
    },
  });

  const response = await request(app).get("/debts/providers/1/customers/123%20456");

  assert.equal(response.status, 200);
  assert.deepEqual(debtQuery, {
    where: {
      tenant_id: "1",
      customer_ref: "123 456",
      status: "PENDING",
    },
    orderBy: { due_date: "asc" },
  });
  assert.equal(response.body.data.customerRef, "123 456");
});

test("GET /debts/providers/:tenantId/customers/:customerRef rejects invalid public identifiers", async () => {
  const app = createApp({
    prismaClient: {
      provider: {
        findMany: async () => [],
        findUnique: async () => {
          throw new Error("should not be called");
        },
      },
      debt: {
        findMany: async () => {
          throw new Error("should not be called");
        },
      },
    },
  });

  const response = await request(app).get("/debts/providers/tenant con espacios/customers/123456");

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.match(response.body.message, /proveedor tiene un formato inválido/i);
});

test("GET /debts/providers/:tenantId/customers/:customerRef returns 404 when provider is missing or inactive", async () => {
  for (const provider of [null, { id: 7, tenant_id: "1", active: false }]) {
    let debtWasQueried = false;

    const app = createApp({
      prismaClient: {
        provider: {
          findMany: async () => [],
          findUnique: async () => provider,
        },
        debt: {
          findMany: async () => {
            debtWasQueried = true;
            return [];
          },
        },
      },
    });

    const response = await request(app).get("/debts/providers/1/customers/1234567");

    assert.equal(response.status, 404);
    assert.equal(response.body.success, false);
    assert.match(response.body.message, /no se encontró un proveedor público/i);
    assert.equal(debtWasQueried, false);
  }
});
