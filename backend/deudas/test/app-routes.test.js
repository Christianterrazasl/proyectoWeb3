const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { createApp } = require("../app");

test("GET /health returns the service heartbeat", async () => {
  const app = createApp({
    prismaClient: {
      provider: {
        findMany: async () => [],
        findUnique: async () => null,
      },
      debt: {
        findMany: async () => [],
      },
    },
  });

  const response = await request(app).get("/health");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    service: "deudas",
    status: "ok",
  });
});

test("GET /debts preserves public list filters and ascending due-date order", async () => {
  let debtQuery = null;

  const app = createApp({
    prismaClient: {
      provider: {
        findMany: async () => [],
        findUnique: async () => null,
      },
      debt: {
        findMany: async (query) => {
          debtQuery = query;
          return [
            {
              id: 11,
              tenant_id: "tenant-1",
              customer_ref: "123456",
              service_id: "agua",
              period: "2026-06",
              amount: 99.5,
              due_date: "2026-06-20T00:00:00.000Z",
              status: "PENDING",
            },
          ];
        },
      },
    },
  });

  const response = await request(app)
    .get("/debts")
    .query({ customer_ref: "123456", tenant_id: "tenant-1", status: "PENDING" });

  assert.equal(response.status, 200);
  assert.deepEqual(debtQuery, {
    where: {
      customer_ref: "123456",
      tenant_id: "tenant-1",
      status: "PENDING",
    },
    orderBy: { due_date: "asc" },
  });
  assert.deepEqual(response.body, [
    {
      id: 11,
      tenant_id: "tenant-1",
      customer_ref: "123456",
      service_id: "agua",
      period: "2026-06",
      amount: 99.5,
      due_date: "2026-06-20T00:00:00.000Z",
      status: "PENDING",
    },
  ]);
});
