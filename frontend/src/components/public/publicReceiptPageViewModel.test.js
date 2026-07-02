import assert from "node:assert/strict";
import test from "node:test";

import { buildPublicReceiptPageModel } from "./publicReceiptPageViewModel.js";

test("buildPublicReceiptPageModel prioritizes success context from the public payment flow", () => {
  const model = buildPublicReceiptPageModel({
    providerId: "electro-norte",
    providerName: "Electro Norte",
    customerRef: "778899",
    receiptHash: "RCPT-123",
    transactionId: "txn-55",
    selectedDebt: {
      serviceId: "ENERGIA-HOGAR",
      amount: 89.5,
      period: "2026-06",
      dueDate: "2026-07-10",
    },
    payment: {
      status: "SUCCESS",
      created_at: "2026-06-22T10:00:00+00:00",
    },
  });

  assert.equal(model.title, "Comprobante listo para compartir");
  assert.equal(
    model.description,
    "Tu pago fue procesado dentro del portal público. Revisa el resumen final, conserva este identificador y abre el comprobante oficial si necesitas compartirlo o descargarlo.",
  );
  assert.equal(model.receiptLabel, "RCPT-123");
  assert.equal(model.statusLabel, "Pago confirmado");
  assert.equal(model.canOpenOfficialReceipt, true);
  assert.equal(model.downloadLabel, "Abrir comprobante oficial");
  assert.equal(model.returnToDebtsHref, "/deuda/electro-norte?customerRef=778899");
  assert.equal(model.detailItems[0].value, "Electro Norte");
  assert.equal(model.detailItems[2].value, "ENERGIA-HOGAR");
  assert.equal(model.detailItems[3].value, "2026-06");
  assert.equal(model.detailItems[4].value, "Bs. 89.50");
  assert.equal(model.detailItems[5].value, "22/6/2026");
});

test("buildPublicReceiptPageModel falls back to transaction data when the navigation state is incomplete", () => {
  const model = buildPublicReceiptPageModel({
    providerId: "aguas-del-sur",
    customerRef: "445566",
    transactionId: "txn-77",
    payment: {
      tenant_id: "tenant-77",
      service_id: "AGUA",
      amount: 44,
      status: "PENDING",
      created_at: "fecha-sin-formato",
    },
  });

  assert.equal(model.receiptLabel, "txn-77");
  assert.equal(model.statusLabel, "Pendiente de validación");
  assert.equal(model.canOpenOfficialReceipt, false);
  assert.equal(model.detailItems[0].value, "tenant-77");
  assert.equal(model.detailItems[2].value, "AGUA");
  assert.equal(model.detailItems[4].value, "Bs. 44.00");
  assert.equal(model.detailItems[5].value, "fecha-sin-formato");
  assert.equal(model.returnToDebtsHref, "/deuda/aguas-del-sur?customerRef=445566");
});
