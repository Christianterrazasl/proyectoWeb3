const test = require("node:test");
const assert = require("node:assert/strict");

const {
  mapAdminDebt,
  mapProvider,
  mapPublicDebt,
} = require("../src/application/mappers/debt-presenters");
const {
  buildDebtPayload,
  isValidDebtStatus,
  isValidPublicIdentifier,
  parseDebtId,
} = require("../src/application/services/debt-payload");
const { parseDebtImportCsv } = require("../src/application/services/debt-import");

test("debt presenters preserve public and admin API contracts", () => {
  const provider = mapProvider({
    id: 7,
    tenant_id: "tenant-1",
    name: "Nur",
    description: "Pago de servicios",
    image_url: "https://placehold.net/1.png",
  });
  const publicDebt = mapPublicDebt({
    id: 11,
    service_id: "agua",
    period: "2026-06",
    amount: 99.5,
    due_date: new Date("2026-06-20T00:00:00.000Z"),
    status: "PENDING",
  });
  const adminDebt = mapAdminDebt({
    id: 11,
    service_id: "agua",
    period: "2026-06",
    amount: 99.5,
    due_date: "2026-06-20T00:00:00.000Z",
    status: "PENDING",
  });

  assert.deepEqual(provider, {
    id: "7",
    name: "Nur",
    description: "Pago de servicios",
    image: "https://placehold.net/1.png",
    idProveedor: "tenant-1",
  });
  assert.deepEqual(publicDebt, {
    id: "11",
    serviceId: "agua",
    period: "2026-06",
    amount: 99.5,
    dueDate: "2026-06-20T00:00:00.000Z",
    status: "PENDING",
  });
  assert.deepEqual(adminDebt, publicDebt);
});

test("debt payload helpers keep validation behavior for ids, status, and body parsing", () => {
  assert.equal(parseDebtId("33"), 33);
  assert.equal(parseDebtId("0"), null);
  assert.equal(isValidPublicIdentifier("abc-123"), true);
  assert.equal(isValidPublicIdentifier("abc 123"), false);
  assert.equal(isValidDebtStatus("paid"), true);
  assert.equal(isValidDebtStatus("archived"), false);
  assert.deepEqual(
    buildDebtPayload(
      {
        tenantId: "tenant-1",
        serviceId: "agua",
        customerRef: "123456",
        period: "2026-06",
        amount: 99.5,
        dueDate: "2026-06-20",
      },
      { requireAllFields: true },
    ),
    {
      data: {
        tenant_id: "tenant-1",
        service_id: "agua",
        customer_ref: "123456",
        period: "2026-06",
        amount: 99.5,
        due_date: new Date("2026-06-20T00:00:00.000Z"),
        status: "PENDING",
      },
    },
  );
  assert.deepEqual(buildDebtPayload({ status: "PAID" }, { allowStatus: false }), {
    error: "El estado de la deuda solo se puede cambiar desde la ruta específica de estado",
  });
});

test("debt import parser preserves CSV contract and row-level validation errors", () => {
  assert.deepEqual(
    parseDebtImportCsv([
      "tenantId,serviceId,customerRef,period,amount,dueDate,status",
      "tenant-1,agua,123456,2026-06,99.5,2026-06-20T00:00:00.000Z,PENDING",
    ].join("\n")),
    {
      data: [
        {
          tenant_id: "tenant-1",
          service_id: "agua",
          customer_ref: "123456",
          period: "2026-06",
          amount: 99.5,
          due_date: new Date("2026-06-20T00:00:00.000Z"),
          status: "PENDING",
        },
      ],
    },
  );
  assert.deepEqual(
    parseDebtImportCsv([
      "tenantId,serviceId,customerRef,period,amount,dueDate,status",
      "tenant-1,agua,123456,2026-06,no-numero,2026-06-20T00:00:00.000Z,PENDING",
    ].join("\n")),
    {
      error: "La fila 2 es inválida: El monto de la deuda debe ser un número válido mayor o igual a cero",
      totalRecords: 0,
    },
  );
});
