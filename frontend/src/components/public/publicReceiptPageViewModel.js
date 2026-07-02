function normalizeText(value, fallback = "Pendiente") {
  const normalized = String(value || "").trim();
  return normalized || fallback;
}

function formatAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Pendiente";
  }

  return `Bs. ${amount.toFixed(2)}`;
}

function formatDate(value) {
  if (!value) {
    return "Pendiente";
  }

  const normalizedValue = String(value).trim();
  const dateOnlyMatch = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  const date = dateOnlyMatch
    ? new Date(
        Number(dateOnlyMatch[1]),
        Number(dateOnlyMatch[2]) - 1,
        Number(dateOnlyMatch[3]),
      )
    : new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return normalizedValue;
  }

  return date.toLocaleDateString("es-BO");
}

function buildReturnToDebtsHref(providerId, customerRef) {
  const normalizedProviderId = String(providerId || "").trim();
  const normalizedCustomerRef = String(customerRef || "").trim();

  if (!normalizedProviderId) {
    return "/";
  }

  const href = `/deuda/${encodeURIComponent(normalizedProviderId)}`;

  if (!normalizedCustomerRef) {
    return href;
  }

  return `${href}?customerRef=${encodeURIComponent(normalizedCustomerRef)}`;
}

function resolveStatusLabel(status) {
  return String(status || "").toUpperCase() === "SUCCESS"
    ? "Pago confirmado"
    : "Pendiente de validación";
}

export function buildPublicReceiptPageModel({
  providerId,
  providerName,
  customerRef,
  receiptHash,
  transactionId,
  selectedDebt,
  payment,
}) {
  const paymentData = payment || {};
  const debt = selectedDebt || {};

  return {
    title: "Comprobante listo para compartir",
    description:
      "Tu pago fue procesado dentro del portal público. Revisa el resumen final, conserva este identificador y abre el comprobante oficial si necesitas compartirlo o descargarlo.",
    receiptLabel:
      normalizeText(receiptHash, "") ||
      normalizeText(paymentData.receipt_hash, "") ||
      normalizeText(transactionId, "Sin comprobante"),
    statusLabel: resolveStatusLabel(paymentData.status),
    canOpenOfficialReceipt: String(paymentData.status || "").toUpperCase() === "SUCCESS",
    downloadLabel: "Abrir comprobante oficial",
    returnToDebtsHref: buildReturnToDebtsHref(providerId, customerRef),
    detailItems: [
      {
        key: "provider",
        label: "Empresa",
        value: normalizeText(providerName, normalizeText(paymentData.tenant_id, "Pendiente")),
      },
      {
        key: "reference",
        label: "Referencia",
        value: normalizeText(customerRef, normalizeText(paymentData.customer_ref, "Pendiente")),
      },
      {
        key: "service",
        label: "Servicio",
        value: normalizeText(debt.serviceId, normalizeText(paymentData.service_id, "Pendiente")),
      },
      {
        key: "period",
        label: "Periodo",
        value: normalizeText(debt.period, "Sin periodo informado"),
      },
      {
        key: "amount",
        label: "Monto pagado",
        value: formatAmount(debt.amount ?? paymentData.amount),
      },
      {
        key: "createdAt",
        label: "Fecha de pago",
        value: formatDate(paymentData.created_at),
      },
    ],
  };
}
