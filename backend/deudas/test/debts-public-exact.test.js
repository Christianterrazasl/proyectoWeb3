const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { createApp } = require("../app");

test("GET /debts filtra una deuda exacta por id y service_id", async () => {
  let debtQuery = null;

  const app = createApp({
    prismaClient: {
      provider: {
        findMany: async () => [],
      },
      debt: {
        findMany: async (query) => {
          debtQuery = query;
          return [
            {
              id: 45,
              tenant_id: "tenant-1",
              service_id: "gas",
              customer_ref: "9988",
              period: "2026-06",
              amount: 44,
              due_date: new Date("2026-06-30T00:00:00.000Z"),
              status: "PENDING",
            },
          ];
        },
      },
    },
  });

  const response = await request(app).get("/debts").query({
    id: "45",
    tenant_id: "tenant-1",
    service_id: "gas",
    customer_ref: "9988",
    status: "PENDING",
  });

  assert.equal(response.status, 200);
  assert.deepEqual(debtQuery, {
    where: {
      id: 45,
      tenant_id: "tenant-1",
      service_id: "gas",
      customer_ref: "9988",
      status: "PENDING",
    },
    orderBy: { due_date: "asc" },
  });
  assert.equal(response.body[0].id, 45);
});

test("GET /debts rechaza ids exactos inválidos", async () => {
  const app = createApp({
    prismaClient: {
      provider: {
        findMany: async () => [],
      },
      debt: {
        findMany: async () => {
          throw new Error("no debería consultarse Prisma");
        },
      },
    },
  });

  const response = await request(app).get("/debts").query({ id: "abc" });

  assert.equal(response.status, 400);
  assert.match(response.body.message, /identificador/i);
});

test("PATCH /internal/debts/:id/status marca como pagada solo la deuda exacta pendiente", async () => {
  let updateManyQuery = null;

  const app = createApp({
    prismaClient: {
      provider: {
        findMany: async () => [],
      },
      debt: {
        updateMany: async (query) => {
          updateManyQuery = query;
          return { count: 1 };
        },
      },
    },
  });

  const response = await request(app)
    .patch("/internal/debts/45/status")
    .send({ status: "PAID" });

  assert.equal(response.status, 200);
  assert.deepEqual(updateManyQuery, {
    where: {
      id: 45,
      status: "PENDING",
    },
    data: { status: "PAID" },
  });
  assert.deepEqual(response.body, {
    success: true,
    data: { id: "45", updated: 1, status: "PAID" },
  });
});

test("PATCH /internal/debts/:id/status devuelve conflicto si la deuda exacta ya no está pendiente", async () => {
  const app = createApp({
    prismaClient: {
      provider: {
        findMany: async () => [],
      },
      debt: {
        updateMany: async () => ({ count: 0 }),
      },
    },
  });

  const response = await request(app)
    .patch("/internal/debts/45/status")
    .send({ status: "PAID" });

  assert.equal(response.status, 409);
  assert.equal(response.body.success, false);
  assert.match(response.body.message, /exacta.*pendiente/i);
});

test("GET /debts/lookup no expone deudas de otro servicio cuando falla la coincidencia exacta", async () => {
  const queries = [];

  const app = createApp({
    prismaClient: {
      provider: {
        findMany: async () => [],
      },
      debt: {
        findMany: async (query) => {
          queries.push(query);

          if (query.where.service_id === "agua") {
            return [];
          }

          return [
            {
              id: 99,
              tenant_id: "tenant-1",
              service_id: "internet",
              customer_ref: "9988",
              period: "2026-06",
              amount: 44,
              due_date: new Date("2026-06-30T00:00:00.000Z"),
              status: "PENDING",
            },
          ];
        },
      },
    },
  });

  const response = await request(app).get("/debts/lookup").query({
    tenantId: "tenant-1",
    serviceId: "agua",
    customerRef: "9988",
  });

  assert.equal(response.status, 404);
  assert.equal(queries.length, 1);
  assert.deepEqual(queries[0], {
    where: {
      tenant_id: "tenant-1",
      customer_ref: "9988",
      status: "PENDING",
      service_id: "agua",
    },
    orderBy: { due_date: "asc" },
  });
  assert.match(response.body.message, /deudas pendientes/i);
});
