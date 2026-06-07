const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { createApp } = require("../app");

test("GET /debts/providers returns the active provider catalog", async () => {
  let providerQuery = null;

  const app = createApp({
    prismaClient: {
      provider: {
        findMany: async (query) => {
          providerQuery = query;
          return [
            {
              id: 7,
              tenant_id: "tenant-1",
              name: "Nur",
              description: "Pago de servicios",
              image_url: "https://placehold.net/1.png",
              active: true,
            },
          ];
        },
        findUnique: async () => null,
      },
      debt: {
        findMany: async () => [],
      },
    },
  });

  const response = await request(app).get("/debts/providers");

  assert.equal(response.status, 200);
  assert.deepEqual(providerQuery, {
    where: { active: true },
    orderBy: { sort_order: "asc" },
  });
  assert.deepEqual(response.body, {
    success: true,
    data: [
      {
        id: "7",
        name: "Nur",
        description: "Pago de servicios",
        image: "https://placehold.net/1.png",
        idProveedor: "tenant-1",
      },
    ],
  });
});

test("POST /debts/lookup returns active providers with pending debts for the customer", async () => {
  let debtQuery = null;
  let providerQuery = null;

  const app = createApp({
    prismaClient: {
      provider: {
        findMany: async (query) => {
          providerQuery = query;
          return [
            {
              id: 7,
              tenant_id: "tenant-1",
              name: "Nur",
              description: "Pago de servicios",
              image_url: "https://placehold.net/1.png",
              active: true,
            },
          ];
        },
        findUnique: async () => null,
      },
      debt: {
        findMany: async (query) => {
          debtQuery = query;
          return [
            {
              id: 11,
              tenant_id: "tenant-1",
              customer_ref: "1234567",
              service_id: "agua-residencial",
              status: "PENDING",
            },
            {
              id: 12,
              tenant_id: "tenant-1",
              customer_ref: "1234567",
              service_id: "agua-residencial",
              status: "PENDING",
            },
          ];
        },
      },
    },
  });

  const response = await request(app).post("/debts/lookup").send({
    customerRef: "1234567",
    serviceId: "agua-residencial",
  });

  assert.equal(response.status, 200);
  assert.deepEqual(debtQuery, {
    where: {
      customer_ref: "1234567",
      status: "PENDING",
      service_id: "agua-residencial",
    },
    orderBy: { due_date: "asc" },
  });
  assert.deepEqual(providerQuery, {
    where: {
      active: true,
      tenant_id: { in: ["tenant-1"] },
    },
    orderBy: { sort_order: "asc" },
  });
  assert.deepEqual(response.body, {
    success: true,
    data: [
      {
        id: "7",
        name: "Nur",
        description: "Pago de servicios",
        image: "https://placehold.net/1.png",
        idProveedor: "tenant-1",
      },
    ],
    meta: {
      customerRef: "1234567",
      totalProviders: 1,
      totalDebts: 2,
    },
  });
});

test("POST /debts/lookup rejects requests without customerRef", async () => {
  const app = createApp({
    prismaClient: {
      provider: {
        findMany: async () => {
          throw new Error("should not be called");
        },
        findUnique: async () => null,
      },
      debt: {
        findMany: async () => {
          throw new Error("should not be called");
        },
      },
    },
  });

  const response = await request(app).post("/debts/lookup").send({});

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.match(response.body.message, /identificador del cliente es obligatorio/i);
});
