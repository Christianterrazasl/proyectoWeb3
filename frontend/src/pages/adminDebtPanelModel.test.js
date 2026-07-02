import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAdminDebtPayload,
  filterAdminDebtRows,
  mapAdminDebtToRow,
  slugifyDebtServiceId,
} from "./adminDebtPanelModel.js";

test("slugifyDebtServiceId normalizes labels for manual admin debt creation", () => {
  assert.equal(slugifyDebtServiceId("Colegiatura Julio 2026"), "colegiatura_julio_2026");
  assert.equal(slugifyDebtServiceId("***", 77), "manual_77");
});

test("buildAdminDebtPayload derives the admin debt request from form fields", () => {
  assert.deepEqual(
    buildAdminDebtPayload({
      activeCompanyId: 42,
      documento: " 1234567 ",
      concepto: "Mensualidad VIP",
      monto: "250.50",
      fecha: "2026-07-15",
    }),
    {
      tenantId: "42",
      serviceId: "mensualidad_vip",
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

  assert.deepEqual(filterAdminDebtRows(rows, "pendientes").map((row) => row.id), [1]);
  assert.deepEqual(filterAdminDebtRows(rows, "pagadas").map((row) => row.id), [2]);
});
