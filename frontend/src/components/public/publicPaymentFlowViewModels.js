function normalizeText(value, fallback = "") {
  const normalized = String(value || "").trim();
  return normalized || fallback;
}

function formatAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return `Bs. ${amount.toFixed(2)}`;
}

function formatDate(value) {
  if (!value) {
    return "—";
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
    return value;
  }

  return date.toLocaleDateString("es-BO");
}

function calculateTotalPending(debts) {
  return debts.reduce((total, debt) => total + Number(debt.amount || 0), 0);
}

export function buildDebtSelectionModel({
  providerName,
  customerRef,
  debts,
  selectedDebt,
}) {
  if (!selectedDebt) {
    return {
      totalPendingLabel: formatAmount(calculateTotalPending(debts || [])),
      selectedAmountLabel: "—",
      summaryItems: [
        { key: "provider", label: "Empresa", value: normalizeText(providerName, "—") },
        { key: "reference", label: "Referencia", value: normalizeText(customerRef, "—") },
        { key: "period", label: "Periodo", value: "—" },
        { key: "dueDate", label: "Vence", value: "—" },
      ],
    };
  }

  return {
    totalPendingLabel: formatAmount(calculateTotalPending(debts || [])),
    selectedAmountLabel: formatAmount(selectedDebt.amount),
    summaryItems: [
      { key: "provider", label: "Empresa", value: normalizeText(providerName, "—") },
      { key: "reference", label: "Referencia", value: normalizeText(customerRef, "—") },
      {
        key: "period",
        label: "Periodo",
        value: normalizeText(selectedDebt.period, "—"),
      },
      {
        key: "dueDate",
        label: "Vence",
        value: formatDate(selectedDebt.dueDate),
      },
    ],
  };
}

const PAYMENT_STAGE_MAP = {
  idle: {
    tone: "neutral",
    title: "Generar QR",
    primaryActionLabel: "Generar QR",
    secondaryActionLabel: "",
    busyLabel: "",
    canGenerateQr: true,
    canConfirmPayment: false,
    canReset: false,
    showQrCard: false,
  },
  generating: {
    tone: "info",
    title: "Generando QR...",
    primaryActionLabel: "",
    secondaryActionLabel: "",
    busyLabel: "Generando...",
    canGenerateQr: false,
    canConfirmPayment: false,
    canReset: false,
    showQrCard: false,
  },
  qr_ready: {
    tone: "info",
    title: "Confirmar pago",
    primaryActionLabel: "Confirmar pago",
    secondaryActionLabel: "Nuevo QR",
    busyLabel: "",
    canGenerateQr: false,
    canConfirmPayment: true,
    canReset: true,
    showQrCard: true,
  },
  confirming: {
    tone: "info",
    title: "Confirmando...",
    primaryActionLabel: "",
    secondaryActionLabel: "",
    busyLabel: "Confirmando...",
    canGenerateQr: false,
    canConfirmPayment: false,
    canReset: false,
    showQrCard: true,
  },
  success: {
    tone: "success",
    title: "Pago confirmado",
    primaryActionLabel: "",
    secondaryActionLabel: "",
    busyLabel: "",
    canGenerateQr: false,
    canConfirmPayment: false,
    canReset: false,
    showQrCard: false,
  },
  error: {
    tone: "error",
    title: "Error en el pago",
    primaryActionLabel: "Reintentar",
    secondaryActionLabel: "",
    busyLabel: "",
    canGenerateQr: true,
    canConfirmPayment: false,
    canReset: false,
    showQrCard: false,
  },
};

export function buildPaymentStageModel({
  paymentStep,
  selectedDebt,
  transactionId,
  paymentError,
}) {
  if (!selectedDebt) {
    return {
      tone: "neutral",
      title: "Selecciona una deuda",
      primaryActionLabel: "",
      secondaryActionLabel: "",
      busyLabel: "",
      canGenerateQr: false,
      canConfirmPayment: false,
      canReset: false,
      showQrCard: false,
    };
  }

  const stage = PAYMENT_STAGE_MAP[paymentStep] || PAYMENT_STAGE_MAP.idle;

  if (paymentStep === "error" && paymentError) {
    return {
      ...stage,
      title: paymentError,
    };
  }

  if (paymentStep === "qr_ready" && transactionId) {
    return stage;
  }

  return stage;
}
