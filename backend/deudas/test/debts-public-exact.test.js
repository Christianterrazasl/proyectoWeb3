const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { createApp } = require("../app");

test("GET /debts supports exact lookup by id, service_id, tenant_id and customer_ref", async () => {
  // This test locks the public contract used by `pagos`: the request must be
  // specific enough to resolve one debt, not a bag of candidate debts.
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
              id: 45,
              tenant_id: "tenant-1",
              service_id: "gas",
              customer_ref: "9988",
              period: "2026-05",
              amount: 44,
              due_date: new Date("2026-05-15T00:00:00.000Z"),
              status: "PENDING",
            },
          ];
        },
      },
    },
  });

  const response = await request(app).get(
    "/debts?id=45&tenant_id=tenant-1&service_id=gas&customer_ref=9988&status=PENDING",
  );

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
  assert.deepEqual(response.body, [
    {
      id: 45,
      tenant_id: "tenant-1",
      service_id: "gas",
      customer_ref: "9988",
      period: "2026-05",
      amount: 44,
      due_date: "2026-05-15T00:00:00.000Z",
      status: "PENDING",
    },
  ]);
});

test("GET /debts rejects an invalid exact debt id before querying Prisma", async () => {
  // Rejecting malformed `id` early protects both Prisma and the downstream
  // payment flow from treating an invalid identifier as a soft empty result.
  let debtWasQueried = false;

  const app = createApp({
    prismaClient: {
      provider: {
        findMany: async () => [],
        findUnique: async () => null,
      },
      debt: {
        findMany: async () => {
          debtWasQueried = true;
          return [];
        },
      },
    },
  });

  const response = await request(app).get("/debts?id=abc&tenant_id=tenant-1&service_id=gas");

  assert.equal(response.status, 400);
  assert.match(response.body.message, /id de deuda/i);
  assert.equal(debtWasQueried, false);
});
