import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDebtSelectionModel,
  buildPaymentStageModel,
} from "./publicPaymentFlowViewModels.js";

test("buildDebtSelectionModel summarizes the currently selected debt", () => {
  const model = buildDebtSelectionModel({
    providerName: "Electro Norte",
    customerRef: "778899",
    debts: [
      { id: "d-1", amount: 120.5, period: "2026-05", dueDate: "2026-06-10" },
      { id: "d-2", amount: 89.5, period: "2026-06", dueDate: "2026-07-10" },
    ],
    selectedDebt: {
      id: "d-2",
      serviceId: "ENERGIA-HOGAR",
      amount: 89.5,
      period: "2026-06",
      dueDate: "2026-07-10",
      status: "pending",
    },
  });

  assert.equal(model.totalPendingLabel, "Bs. 210.00");
  assert.equal(model.selectedAmountLabel, "Bs. 89.50");
  assert.deepEqual(model.summaryItems, [
    { key: "provider", label: "Empresa", value: "Electro Norte" },
    { key: "reference", label: "Referencia", value: "778899" },
    { key: "period", label: "Periodo", value: "2026-06" },
    { key: "dueDate", label: "Vence", value: "10/7/2026" },
  ]);
});

test("buildDebtSelectionModel falls back when no debt has been chosen yet", () => {
  const model = buildDebtSelectionModel({
    providerName: "Aguas del Sur",
    customerRef: "112233",
    debts: [{ id: "d-1", amount: 45 }],
    selectedDebt: null,
  });

  assert.equal(model.selectedAmountLabel, "—");
  assert.equal(model.summaryItems[2].value, "—");
});

test("buildPaymentStageModel exposes confirm action in qr_ready stage", () => {
  const model = buildPaymentStageModel({
    paymentStep: "qr_ready",
    selectedDebt: { id: "d-2", serviceId: "ENERGIA-HOGAR", amount: 89.5 },
    transactionId: "tx-123",
  });

  assert.equal(model.title, "Confirmar pago");
  assert.equal(model.primaryActionLabel, "Confirmar pago");
  assert.equal(model.canConfirmPayment, true);
  assert.equal(model.showQrCard, true);
});

test("buildPaymentStageModel surfaces payment errors", () => {
  const model = buildPaymentStageModel({
    paymentStep: "error",
    selectedDebt: { id: "d-2", serviceId: "ENERGIA-HOGAR", amount: 89.5 },
    paymentError: "El proveedor rechazó la solicitud",
  });

  assert.equal(model.tone, "error");
  assert.equal(model.title, "El proveedor rechazó la solicitud");
  assert.equal(model.primaryActionLabel, "Reintentar");
  assert.equal(model.canGenerateQr, true);
});
