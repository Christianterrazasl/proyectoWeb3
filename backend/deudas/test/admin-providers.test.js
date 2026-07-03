const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { createApp } = require("../app");

function createAdminProviderApp(prismaClient) {
  return createApp({
    prismaClient,
    adminDebtRoutesOptions: {
      requireAdminSessionMiddleware: (_req, _res, next) => next(),
    },
  });
}

test("POST /admin/providers guarda metadata vacía cuando no recibe placeholders reales", async () => {
  let upsertQuery = null;

  const app = createAdminProviderApp({
    provider: {
      findMany: async () => [],
      upsert: async (query) => {
        upsertQuery = query;
        return {
          id: 7,
          tenant_id: query.create.tenant_id,
          name: query.create.name,
          description: query.create.description,
          image_url: query.create.image_url,
          active: true,
          sort_order: query.create.sort_order,
        };
      },
    },
    debt: {
      findMany: async () => [],
    },
  });

  const response = await request(app).post("/admin/providers").send({
    tenantId: "77",
    name: "Empresa Real",
  });

  assert.equal(response.status, 201);
  assert.deepEqual(upsertQuery, {
    where: { tenant_id: "77" },
    update: {
      name: "Empresa Real",
      description: "",
      image_url: "",
      active: true,
    },
    create: {
      tenant_id: "77",
      name: "Empresa Real",
      description: "",
      image_url: "",
      active: true,
      sort_order: 999,
    },
  });
  assert.equal(response.body.data.description, "");
  assert.equal(response.body.data.image, "");
});

test("POST /admin/providers conserva metadata real cuando se envía", async () => {
  let upsertQuery = null;

  const app = createAdminProviderApp({
    provider: {
      findMany: async () => [],
      upsert: async (query) => {
        upsertQuery = query;
        return {
          id: 8,
          tenant_id: query.create.tenant_id,
          name: query.create.name,
          description: query.create.description,
          image_url: query.create.image_url,
          active: true,
          sort_order: query.create.sort_order,
        };
      },
    },
    debt: {
      findMany: async () => [],
    },
  });

  const response = await request(app).post("/admin/providers").send({
    tenantId: "78",
    name: "Empresa Real",
    description: "Pagos universitarios",
    imageUrl: "https://cdn.real/logo.png",
    sortOrder: 3,
  });

  assert.equal(response.status, 201);
  assert.equal(upsertQuery.create.description, "Pagos universitarios");
  assert.equal(upsertQuery.create.image_url, "https://cdn.real/logo.png");
  assert.equal(upsertQuery.create.sort_order, 3);
  assert.equal(response.body.data.description, "Pagos universitarios");
  assert.equal(response.body.data.image, "https://cdn.real/logo.png");
});
