const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const { createApp } = require("../app");
const { createRequireProviderSession } = require("../src/api/middleware/requireProviderSession");

function createAdminApp({ prismaClient, globalRole = "provider" }) {
  return createApp({
    prismaClient,
    adminDebtRoutesOptions: {
      requireProviderSessionMiddleware: createRequireProviderSession({
        fetchCurrentSession: async ({ authorization, companyId }) => {
          assert.equal(authorization, "Bearer test-token");
          assert.equal(Number.isInteger(companyId), true);

          return {
            ok: true,
            status: 200,
            body: {
              user: { global_role: globalRole },
            },
          };
        },
      }),
    },
  });
}

function withProviderAuth(requestBuilder, companyId = "1") {
  return requestBuilder
    .set("Authorization", "Bearer test-token")
    .set("X-Company-Id", String(companyId));
}

test("POST /admin/debts creates an operational debt", async () => {
  let createQuery = null;

  const app = createAdminApp({
    prismaClient: {
      provider: {
        findMany: async () => [],
        findUnique: async () => ({ id: 1, tenant_id: "tenant-1", active: true }),
      },
      debt: {
        create: async (query) => {
          createQuery = query;
          return {
            id: 21,
            tenant_id: query.data.tenant_id,
            service_id: query.data.service_id,
            customer_ref: query.data.customer_ref,
            period: query.data.period,
            amount: query.data.amount,
            due_date: query.data.due_date,
            status: query.data.status,
          };
        },
      },
    },
  });

  const payload = {
    tenantId: "1",
    serviceId: "agua-residencial",
    customerRef: "1234567",
    period: "2026-06",
    amount: 99.5,
    dueDate: "2026-06-20T00:00:00.000Z",
    status: "PENDING",
  };

  const response = await withProviderAuth(request(app).post("/admin/debts")).send(payload);

  assert.equal(response.status, 201);
  assert.deepEqual(createQuery, {
    data: {
      tenant_id: "1",
      service_id: "agua-residencial",
      customer_ref: "1234567",
      period: "2026-06",
      amount: 99.5,
      due_date: new Date("2026-06-20T00:00:00.000Z"),
      status: "PENDING",
    },
  });
  assert.deepEqual(response.body.data, {
    id: "21",
    tenantId: "1",
    customerRef: "1234567",
    serviceId: "agua-residencial",
    period: "2026-06",
    amount: 99.5,
    dueDate: "2026-06-20T00:00:00.000Z",
    status: "PENDING",
  });
});

test("PATCH /admin/debts/:id edits an operational debt", async () => {
  let updateQuery = null;

  const app = createAdminApp({
    prismaClient: {
      provider: {
        findMany: async (query) => {
          assert.deepEqual(query, {
            where: {
              active: true,
               tenant_id: { in: ["1", "2"] },
            },
          });
          return [
             { id: 1, tenant_id: "1", active: true },
             { id: 2, tenant_id: "2", active: true },
          ];
        },
        findUnique: async () => null,
      },
      debt: {
        update: async (query) => {
          updateQuery = query;
          return {
            id: 33,
             tenant_id: "1",
            service_id: query.data.service_id,
            customer_ref: query.data.customer_ref,
            period: query.data.period,
            amount: query.data.amount,
            due_date: query.data.due_date,
            status: "PENDING",
          };
        },
      },
    },
  });

  const response = await withProviderAuth(request(app).patch("/admin/debts/33")).send({
    serviceId: "internet-fibra",
    customerRef: "ABC123",
    period: "2026-07",
    amount: 150,
    dueDate: "2026-07-10T00:00:00.000Z",
  });

  assert.equal(response.status, 200);
  assert.deepEqual(updateQuery, {
    where: { id: 33 },
    data: {
      service_id: "internet-fibra",
      customer_ref: "ABC123",
      period: "2026-07",
      amount: 150,
      due_date: new Date("2026-07-10T00:00:00.000Z"),
    },
  });
  assert.deepEqual(response.body.data, {
    id: "33",
    tenantId: "1",
    customerRef: "ABC123",
    serviceId: "internet-fibra",
    period: "2026-07",
    amount: 150,
    dueDate: "2026-07-10T00:00:00.000Z",
    status: "PENDING",
  });
});

test("PATCH /admin/debts/:id/status changes the debt status", async () => {
  let updateQuery = null;

  const app = createAdminApp({
    prismaClient: {
      provider: {
        findMany: async (query) => {
          assert.deepEqual(query, {
            where: {
              active: true,
               tenant_id: { in: ["1"] },
            },
          });
           return [{ id: 1, tenant_id: "1", active: true }];
        },
        findUnique: async () => null,
      },
      debt: {
        update: async (query) => {
          updateQuery = query;
          return {
            id: 45,
             tenant_id: "2",
            service_id: "gas",
            customer_ref: "9988",
            period: "2026-05",
            amount: 44,
            due_date: new Date("2026-05-15T00:00:00.000Z"),
            status: query.data.status,
          };
        },
      },
    },
  });

  const response = await withProviderAuth(request(app).patch("/admin/debts/45/status")).send({
    status: "PAID",
  });

  assert.equal(response.status, 200);
  assert.deepEqual(updateQuery, {
    where: { id: 45 },
    data: { status: "PAID" },
  });
  assert.equal(response.body.data.status, "PAID");
});

test("PATCH /admin/debts/:id returns 404 when Prisma reports a missing debt", async () => {
  const app = createAdminApp({
    prismaClient: {
      provider: {
        findMany: async (query) => {
          assert.deepEqual(query, {
            where: {
              active: true,
               tenant_id: { in: ["1", "2"] },
            },
          });
          return [
             { id: 1, tenant_id: "1", active: true },
             { id: 2, tenant_id: "2", active: true },
          ];
        },
        findUnique: async () => null,
      },
      debt: {
        update: async () => {
          const error = new Error("Record to update not found");
          error.code = "P2025";
          throw error;
        },
      },
    },
  });

  const response = await withProviderAuth(request(app).patch("/admin/debts/99")).send({
    amount: 200,
  });

  assert.equal(response.status, 404);
  assert.equal(response.body.success, false);
  assert.match(response.body.message, /no se encontró la deuda/i);
});

test("PATCH /admin/debts/:id/status returns 404 when Prisma reports a missing debt", async () => {
  const app = createAdminApp({
    prismaClient: {
      provider: {
        findMany: async (query) => {
          assert.deepEqual(query, {
            where: {
              active: true,
               tenant_id: { in: ["1"] },
            },
          });
           return [{ id: 1, tenant_id: "1", active: true }];
        },
        findUnique: async () => null,
      },
      debt: {
        update: async () => {
          const error = new Error("Record to update not found");
          error.code = "P2025";
          throw error;
        },
      },
    },
  });

  const response = await withProviderAuth(request(app).patch("/admin/debts/99/status")).send({
    status: "PAID",
  });

  assert.equal(response.status, 404);
  assert.equal(response.body.success, false);
  assert.match(response.body.message, /no se encontró la deuda/i);
});

test("PATCH /admin/debts/:id/status rejects an invalid debt status", async () => {
  let updateWasCalled = false;

  const app = createAdminApp({
    prismaClient: {
      provider: {
        findMany: async (query) => {
          assert.deepEqual(query, {
            where: {
              active: true,
               tenant_id: { in: ["1", "2"] },
            },
          });
          return [
             { id: 1, tenant_id: "1", active: true },
             { id: 2, tenant_id: "2", active: true },
          ];
        },
        findUnique: async () => null,
      },
      debt: {
        update: async () => {
          updateWasCalled = true;
          return {};
        },
      },
    },
  });

  const response = await withProviderAuth(request(app).patch("/admin/debts/45/status")).send({
    status: "ARCHIVED",
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.match(response.body.message, /estado de la deuda es inválido/i);
  assert.equal(updateWasCalled, false);
});

test("PATCH /admin/debts/:id rejects status changes outside the dedicated status route", async () => {
  let updateWasCalled = false;

  const app = createAdminApp({
    prismaClient: {
      provider: {
        findMany: async (query) => {
          assert.deepEqual(query, {
            where: {
              active: true,
               tenant_id: { in: ["1"] },
            },
          });
           return [{ id: 1, tenant_id: "1", active: true }];
        },
        findUnique: async () => null,
      },
      debt: {
        update: async () => {
          updateWasCalled = true;
          return {};
        },
      },
    },
  });

  const response = await withProviderAuth(request(app).patch("/admin/debts/33")).send({
    status: "PAID",
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.match(response.body.message, /estado.*ruta/i);
  assert.equal(updateWasCalled, false);
});

test("POST /admin/debts rejects invalid operational input", async () => {
  let createWasCalled = false;

  const app = createAdminApp({
    prismaClient: {
      provider: {
        findMany: async () => [],
        findUnique: async () => null,
      },
      debt: {
        create: async () => {
          createWasCalled = true;
          return {};
        },
      },
    },
  });

  const response = await withProviderAuth(request(app).post("/admin/debts")).send({
    tenantId: "1",
    serviceId: "agua-residencial",
    customerRef: "1234567",
    period: "2026-06",
    amount: -10,
    dueDate: "invalid-date",
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.match(response.body.message, /monto|fecha/i);
  assert.equal(createWasCalled, false);
});

test("POST /admin/debts rejects unknown or inactive providers", async () => {
  for (const provider of [null, { id: 5, tenant_id: "1", active: false }]) {
    let createWasCalled = false;

    const app = createAdminApp({
      prismaClient: {
        provider: {
          findMany: async () => [],
          findUnique: async (query) => {
            assert.deepEqual(query, { where: { tenant_id: "1" } });
            return provider;
          },
        },
        debt: {
          create: async () => {
            createWasCalled = true;
            return {};
          },
        },
      },
    });

    const response = await withProviderAuth(request(app).post("/admin/debts")).send({
      tenantId: "1",
      serviceId: "agua-residencial",
      customerRef: "1234567",
      period: "2026-06",
      amount: 99.5,
      dueDate: "2026-06-20T00:00:00.000Z",
      status: "PENDING",
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
    assert.match(response.body.message, /proveedor activo/i);
    assert.equal(createWasCalled, false);
  }
});

test("PATCH /admin/debts/:id rejects impossible due dates instead of normalizing them", async () => {
  let updateWasCalled = false;

  const app = createAdminApp({
    prismaClient: {
      provider: {
        findMany: async () => [],
        findUnique: async () => null,
      },
      debt: {
        update: async () => {
          updateWasCalled = true;
          return {};
        },
      },
    },
  });

  const response = await withProviderAuth(request(app).patch("/admin/debts/33")).send({
    dueDate: "2026-02-31T00:00:00.000Z",
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.match(response.body.message, /fecha de vencimiento/i);
  assert.equal(updateWasCalled, false);
});

test("PATCH /admin/debts/:id revalidates the provider when tenantId changes", async () => {
  let updateQuery = null;
  let providerLookupCount = 0;

  const app = createAdminApp({
    prismaClient: {
      provider: {
        findMany: async () => [],
        findUnique: async (query) => {
          providerLookupCount += 1;
          assert.deepEqual(query, { where: { tenant_id: "2" } });
          return { id: 2, tenant_id: "2", active: true };
        },
      },
      debt: {
        update: async (query) => {
          updateQuery = query;
          return {
            id: 33,
            tenant_id: query.data.tenant_id,
            service_id: "internet-fibra",
            customer_ref: "ABC123",
            period: "2026-07",
            amount: 150,
            due_date: new Date("2026-07-10T00:00:00.000Z"),
            status: "PENDING",
          };
        },
      },
    },
  });

  const response = await withProviderAuth(request(app).patch("/admin/debts/33")).send({
    tenantId: "2",
  });

  assert.equal(response.status, 200);
  assert.deepEqual(updateQuery, {
    where: { id: 33 },
    data: {
      tenant_id: "2",
    },
  });
  assert.equal(providerLookupCount, 1);
  assert.equal(response.body.data.id, "33");
});

test("PATCH /admin/debts/:id rejects tenantId changes when the provider is inactive or missing", async () => {
  for (const provider of [null, { id: 2, tenant_id: "2", active: false }]) {
    let updateWasCalled = false;
    let providerLookupCount = 0;

    const app = createAdminApp({
      prismaClient: {
        provider: {
          findMany: async () => [],
          findUnique: async (query) => {
            providerLookupCount += 1;
            assert.deepEqual(query, { where: { tenant_id: "2" } });
            return provider;
          },
        },
        debt: {
          update: async () => {
            updateWasCalled = true;
            return {};
          },
        },
      },
    });

    const response = await withProviderAuth(request(app).patch("/admin/debts/33")).send({
      tenantId: "2",
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
    assert.match(response.body.message, /proveedor activo/i);
    assert.equal(providerLookupCount, 1);
    assert.equal(updateWasCalled, false);
  }
});

test("POST /admin/debts/import imports a CSV batch and stores the import summary", async () => {
  let createManyQuery = null;
  let importCreateQuery = null;

  const app = createAdminApp({
    prismaClient: {
      provider: {
        findMany: async (query) => {
          assert.deepEqual(query, {
            where: {
              active: true,
               tenant_id: { in: ["1"] },
            },
          });
          return [
             { id: 1, tenant_id: "1", active: true },
             { id: 2, tenant_id: "2", active: true },
          ];
        },
        findUnique: async () => null,
      },
      debt: {
        createMany: async (query) => {
          createManyQuery = query;
          return { count: query.data.length };
        },
      },
      import: {
        create: async (query) => {
          importCreateQuery = query;
          return {
            id: 7,
            filename: query.data.filename,
            total_records: query.data.total_records,
            status: query.data.status,
          };
        },
      },
    },
  });

  const response = await withProviderAuth(request(app).post("/admin/debts/import")).send({
    filename: "deudas-junio.csv",
    csvContent: [
      "tenantId,serviceId,customerRef,period,amount,dueDate,status",
      "1,agua,123456,2026-06,99.5,2026-06-20T00:00:00.000Z,PENDING",
      "2,internet,ABC123,2026-07,150,2026-07-10T00:00:00.000Z,PAID",
    ].join("\n"),
  });

  assert.equal(response.status, 201);
  assert.deepEqual(createManyQuery, {
    data: [
      {
        tenant_id: "1",
        service_id: "agua",
        customer_ref: "123456",
        period: "2026-06",
        amount: 99.5,
        due_date: new Date("2026-06-20T00:00:00.000Z"),
        status: "PENDING",
      },
      {
        tenant_id: "1",
        service_id: "internet",
        customer_ref: "ABC123",
        period: "2026-07",
        amount: 150,
        due_date: new Date("2026-07-10T00:00:00.000Z"),
        status: "PAID",
      },
    ],
  });
  assert.deepEqual(importCreateQuery, {
    data: {
      filename: "deudas-junio.csv",
      total_records: 2,
      status: "COMPLETED",
    },
  });
  assert.deepEqual(response.body, {
    success: true,
    data: {
      importId: "7",
      filename: "deudas-junio.csv",
      totalRecords: 2,
      importedRecords: 2,
      status: "COMPLETED",
    },
  });
});

test("POST /admin/debts/import returns 400 when the CSV headers do not match the contract", async () => {
  let createManyWasCalled = false;
  let importWasCalled = false;

  const app = createAdminApp({
    prismaClient: {
      provider: {
        findMany: async () => [],
        findUnique: async () => null,
      },
      debt: {
        createMany: async () => {
          createManyWasCalled = true;
          return { count: 0 };
        },
      },
      import: {
        create: async () => {
          importWasCalled = true;
          return {};
        },
      },
    },
  });

  const response = await withProviderAuth(request(app).post("/admin/debts/import")).send({
    filename: "deudas-invalidas.csv",
    csvContent: [
      "tenantId,serviceId,customerRef,period,amount,dueDate",
      "1,agua,123456,2026-06,99.5,2026-06-20T00:00:00.000Z",
    ].join("\n"),
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.match(response.body.message, /columnas requeridas|encabezados/i);
  assert.equal(createManyWasCalled, false);
  assert.equal(importWasCalled, false);
});

test("POST /admin/debts/import returns 400 for an invalid row and stores the failed import summary", async () => {
  let createManyWasCalled = false;
  let importCreateQuery = null;

  const app = createAdminApp({
    prismaClient: {
      provider: {
        findMany: async () => [],
        findUnique: async () => null,
      },
      debt: {
        createMany: async () => {
          createManyWasCalled = true;
          return { count: 0 };
        },
      },
      import: {
        create: async (query) => {
          importCreateQuery = query;
          return {
            id: 8,
            filename: query.data.filename,
            total_records: query.data.total_records,
            status: query.data.status,
          };
        },
      },
    },
  });

  const response = await withProviderAuth(request(app).post("/admin/debts/import")).send({
    filename: "deudas-invalidas.csv",
    csvContent: [
      "tenantId,serviceId,customerRef,period,amount,dueDate,status",
      "1,agua,123456,2026-06,no-numero,2026-06-20T00:00:00.000Z,PENDING",
    ].join("\n"),
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.match(response.body.message, /fila 2|monto/i);
  assert.equal(createManyWasCalled, false);
  assert.deepEqual(importCreateQuery, {
    data: {
      filename: "deudas-invalidas.csv",
      total_records: 0,
      status: "FAILED",
    },
  });
});

test("POST /admin/debts/import stores zero imported records when validation fails after valid rows", async () => {
  let importCreateQuery = null;

  const app = createAdminApp({
    prismaClient: {
      provider: {
        findMany: async () => [],
        findUnique: async () => null,
      },
      debt: {
        createMany: async () => {
          throw new Error("createMany no debe ejecutarse cuando el CSV es inválido");
        },
      },
      import: {
        create: async (query) => {
          importCreateQuery = query;
          return {
            id: 9,
            filename: query.data.filename,
            total_records: query.data.total_records,
            status: query.data.status,
          };
        },
      },
    },
  });

  const response = await withProviderAuth(request(app).post("/admin/debts/import")).send({
    filename: "deudas-invalidas.csv",
    csvContent: [
      "tenantId,serviceId,customerRef,period,amount,dueDate,status",
      "1,agua,123456,2026-06,99.5,2026-06-20T00:00:00.000Z,PENDING",
      "2,internet,ABC123,2026-07,no-numero,2026-07-10T00:00:00.000Z,PAID",
    ].join("\n"),
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.match(response.body.message, /fila 3|monto/i);
  assert.deepEqual(importCreateQuery, {
    data: {
      filename: "deudas-invalidas.csv",
      total_records: 0,
      status: "FAILED",
    },
  });
});

test("POST /admin/debts/import rejects rows with unknown or inactive providers", async () => {
  for (const scenario of [
    {
      companyId: "404",
      activeProviders: [{ id: 1, tenant_id: "1", active: true }],
    },
    {
      companyId: "2",
      activeProviders: [{ id: 1, tenant_id: "1", active: true }],
    },
  ]) {
    let createManyWasCalled = false;
    let importCreateQuery = null;
    let providerQuery = null;

    const app = createAdminApp({
      prismaClient: {
        provider: {
          findMany: async (query) => {
            providerQuery = query;
            return scenario.activeProviders;
          },
          findUnique: async () => null,
        },
        debt: {
          createMany: async () => {
            createManyWasCalled = true;
            return { count: 0 };
          },
        },
        import: {
          create: async (query) => {
            importCreateQuery = query;
            return {
              id: 10,
              filename: query.data.filename,
              total_records: query.data.total_records,
              status: query.data.status,
            };
          },
        },
      },
    });

    const response = await withProviderAuth(request(app).post("/admin/debts/import"), scenario.companyId).send({
      filename: "deudas-invalidas.csv",
      csvContent: [
        "tenantId,serviceId,customerRef,period,amount,dueDate,status",
        "1,agua,123456,2026-06,99.5,2026-06-20T00:00:00.000Z,PENDING",
        `${scenario.companyId},internet,ABC123,2026-07,150,2026-07-10T00:00:00.000Z,PAID`,
      ].join("\n"),
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
    assert.match(response.body.message, /fila 2|proveedor activo/i);
    assert.deepEqual(providerQuery, {
      where: {
        active: true,
        tenant_id: { in: [scenario.companyId] },
      },
    });
    assert.equal(createManyWasCalled, false);
    assert.deepEqual(importCreateQuery, {
      data: {
        filename: "deudas-invalidas.csv",
        total_records: 0,
        status: "FAILED",
      },
    });
  }
});

test("POST /admin/debts/import rolls back created debts when the import summary cannot be persisted", async () => {
  let committedDebts = [];
  let transactionWasUsed = false;

  const app = createAdminApp({
    prismaClient: {
      provider: {
        findMany: async (query) => {
          assert.deepEqual(query, {
            where: {
              active: true,
               tenant_id: { in: ["1"] },
            },
          });
           return [{ id: 1, tenant_id: "1", active: true }];
        },
        findUnique: async () => null,
      },
      debt: {
        createMany: async () => {
          throw new Error("La ruta debe usar la transacción, no el cliente raíz");
        },
      },
      import: {
        create: async () => {
          throw new Error("La ruta debe usar la transacción, no el cliente raíz");
        },
      },
      $transaction: async (callback) => {
        transactionWasUsed = true;
        const stagedDebts = [];
        const tx = {
          debt: {
            createMany: async (query) => {
              stagedDebts.push(...query.data);
              return { count: query.data.length };
            },
          },
          import: {
            create: async () => {
              throw new Error("No se pudo guardar el resumen de la importación");
            },
          },
        };

        try {
          const result = await callback(tx);
          committedDebts = stagedDebts;
          return result;
        } catch (error) {
          committedDebts = [];
          throw error;
        }
      },
    },
  });

  const response = await withProviderAuth(request(app).post("/admin/debts/import")).send({
    filename: "deudas-junio.csv",
    csvContent: [
      "tenantId,serviceId,customerRef,period,amount,dueDate,status",
      "1,agua,123456,2026-06,99.5,2026-06-20T00:00:00.000Z,PENDING",
    ].join("\n"),
  });

  assert.equal(response.status, 500);
  assert.equal(response.body.success, false);
  assert.match(response.body.message, /no se pudo importar el lote/i);
  assert.equal(transactionWasUsed, true);
  assert.deepEqual(committedDebts, []);
});
