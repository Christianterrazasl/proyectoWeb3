import test from "node:test";
import assert from "node:assert/strict";

import {
  buildProviderCompanyOptions,
  getProviderScopedEmptyState,
  mapProviderDebtToRow,
} from "./providerPanelModel.js";

test("buildProviderCompanyOptions reflects only accessible auth companies", () => {
  assert.deepEqual(
    buildProviderCompanyOptions([
      { id: 1, name: "Nur" },
      { id: 2, name: "Saguapac" },
      { id: null, name: "Inválida" },
    ]),
    [
      { id: 1, label: "Nur" },
      { id: 2, label: "Saguapac" },
    ],
  );
});

test("mapProviderDebtToRow preserves provider debt status and date formatting", () => {
  assert.deepEqual(
    mapProviderDebtToRow({
      id: 4,
      customerRef: "1234567",
      serviceId: "internet",
      amount: 88,
      dueDate: "2026-07-21T00:00:00.000Z",
      status: "PAID",
    }),
    {
      id: 4,
      documento: "1234567",
      concepto: "internet",
      monto: 88,
      fecha: "2026-07-21",
      estado: "pagada",
    },
  );
});

test("getProviderScopedEmptyState guides the provider with the active company context", () => {
  assert.equal(
    getProviderScopedEmptyState({
      activeCompanyName: "Saguapac",
      tab: "pendientes",
    }),
    "No hay deudas pendientes para Saguapac.",
  );
  assert.equal(
    getProviderScopedEmptyState({
      activeCompanyName: "Nur",
      tab: "pagadas",
    }),
    "No hay deudas pagadas para Nur.",
  );
});
