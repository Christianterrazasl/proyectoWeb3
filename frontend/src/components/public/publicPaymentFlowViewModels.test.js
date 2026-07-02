import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDebtSelectionModel,
  buildPaymentStageModel,
} from "./publicPaymentFlowViewModels.js";

test("buildDebtSelectionModel summarizes the currently selected debt and the next payment step", () => {
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

  assert.equal(model.headerTitle, "Listo para pagar 1 obligación seleccionada");
  assert.equal(
    model.headerDescription,
    "Mantén el mismo flujo: valida esta obligación, genera el QR y confirma el pago antes de revisar el comprobante.",
  );
  assert.equal(model.totalPendingLabel, "Bs. 210.00");
  assert.equal(model.selectedAmountLabel, "Bs. 89.50");
  assert.deepEqual(model.summaryItems, [
    { key: "provider", label: "Empresa", value: "Electro Norte" },
    { key: "reference", label: "Referencia", value: "778899" },
    { key: "period", label: "Periodo", value: "2026-06" },
    { key: "dueDate", label: "Vence", value: "10/7/2026" },
  ]);
  assert.equal(
    model.nextStepLabel,
    "Siguiente paso: genera el QR para continuar con el pago.",
  );
});

test("buildDebtSelectionModel falls back to guided pending copy when no debt has been chosen yet", () => {
  const model = buildDebtSelectionModel({
    providerName: "Aguas del Sur",
    customerRef: "112233",
    debts: [{ id: "d-1", amount: 45 }],
    selectedDebt: null,
  });

  assert.equal(model.headerTitle, "Selecciona una deuda para continuar");
  assert.equal(model.selectedAmountLabel, "Pendiente");
  assert.equal(
    model.nextStepLabel,
    "Primero elige una obligación de la lista para habilitar el flujo de pago QR.",
  );
  assert.equal(model.summaryItems[2].value, "Pendiente de selección");
});

test("buildPaymentStageModel explains the QR-ready stage with confirm action guidance", () => {
  const model = buildPaymentStageModel({
    paymentStep: "qr_ready",
    selectedDebt: { id: "d-2", serviceId: "ENERGIA-HOGAR", amount: 89.5 },
    transactionId: "tx-123",
  });

  assert.deepEqual(model, {
    tone: "info",
    stageLabel: "Paso 2 de 2",
    title: "Escanea el QR y confirma el pago",
    description:
      "Usa tu banca o billetera para pagar esta obligación. Cuando termines, confirma la transacción para pasar al comprobante del mismo flujo.",
    helperLabel: "Transacción activa: tx-123",
    primaryActionLabel: "Confirmar pago",
    secondaryActionLabel: "Generar un nuevo QR",
    busyLabel: "",
    canGenerateQr: false,
    canConfirmPayment: true,
    canReset: true,
    showQrCard: true,
  });
});

test("buildPaymentStageModel reports blocking error copy when QR generation or confirmation fails", () => {
  const model = buildPaymentStageModel({
    paymentStep: "error",
    selectedDebt: { id: "d-2", serviceId: "ENERGIA-HOGAR", amount: 89.5 },
    paymentError: "El proveedor rechazó la solicitud",
  });

  assert.equal(model.tone, "error");
  assert.equal(model.title, "Necesitamos reintentar este pago");
  assert.equal(model.primaryActionLabel, "Intentar nuevamente");
  assert.equal(model.canGenerateQr, true);
  assert.equal(model.canConfirmPayment, false);
  assert.equal(model.showQrCard, false);
  assert.equal(model.helperLabel, "El proveedor rechazó la solicitud");
});
