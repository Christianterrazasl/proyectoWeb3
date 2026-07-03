import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCatalogServiceOptions,
  buildAdminDebtPayload,
  filterAdminDebtRows,
  mapAdminDebtToRow,
} from "./adminDebtPanelModel.js";

test("buildCatalogServiceOptions keeps only real catalog services", () => {
  assert.deepEqual(
    buildCatalogServiceOptions([
      { serviceId: "agua", serviceName: "Agua residencial" },
      { id: "internet", name: "Internet fibra" },
      { serviceId: "", serviceName: "Inválido" },
      null,
    ]),
    [
      { id: "agua", label: "Agua residencial" },
      { id: "internet", label: "Internet fibra" },
    ],
  );
});

test("buildAdminDebtPayload uses the selected real serviceId", () => {
  assert.deepEqual(
    buildAdminDebtPayload({
      activeCompanyId: 42,
      serviceId: "mensualidad-vip",
      documento: " 1234567 ",
      monto: "250.50",
      fecha: "2026-07-15",
    }),
    {
      tenantId: "42",
      serviceId: "mensualidad-vip",
      customerRef: "1234567",
      period: "2026-07",
      amount: 250.5,
      dueDate: "2026-07-15T00:00:00.000Z",
    },
  );
});

test("mapAdminDebtToRow and filterAdminDebtRows expose paid and pending states", () => {
  const rows = [
    mapAdminDebtToRow({
      id: 1,
      customerRef: "A-1",
      serviceId: "agua",
      amount: 100,
      dueDate: "2026-07-15T00:00:00.000Z",
      status: "PENDING",
    }),
    mapAdminDebtToRow({
      id: 2,
      customerRef: "B-2",
      serviceId: "internet",
      amount: 80,
      dueDate: "2026-07-20T00:00:00.000Z",
      status: "PAID",
    }),
  ];

  assert.equal(rows[0].concepto, "agua");
  assert.equal(rows[1].concepto, "internet");
  assert.deepEqual(filterAdminDebtRows(rows, "pendientes").map((row) => row.id), [1]);
  assert.deepEqual(filterAdminDebtRows(rows, "pagadas").map((row) => row.id), [2]);
});

test("mapAdminDebtToRow preserves missing serviceId without inventing a manual label", () => {
  assert.equal(
    mapAdminDebtToRow({
      id: 3,
      customerRef: "C-3",
      serviceId: "",
      amount: 25,
      dueDate: "2026-07-21T00:00:00.000Z",
      status: "PENDING",
    }).concepto,
    "—",
  );
});
