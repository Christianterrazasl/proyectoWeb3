function normalizeText(value, fallback = "") {
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
    return "Pendiente de selección";
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
      headerTitle: "Selecciona una deuda para continuar",
      headerDescription:
        "Elige una obligación pendiente para revisar el resumen, activar el panel derecho y continuar con el pago QR.",
      totalPendingLabel: formatAmount(calculateTotalPending(debts || [])),
      selectedAmountLabel: "Pendiente",
      summaryItems: [
        { key: "provider", label: "Empresa", value: normalizeText(providerName, "Pendiente") },
        { key: "reference", label: "Referencia", value: normalizeText(customerRef, "Pendiente") },
        { key: "period", label: "Periodo", value: "Pendiente de selección" },
        { key: "dueDate", label: "Vence", value: "Pendiente de selección" },
      ],
      nextStepLabel:
        "Primero elige una obligación de la lista para habilitar el flujo de pago QR.",
    };
  }

  return {
    headerTitle: "Listo para pagar 1 obligación seleccionada",
    headerDescription:
      "Mantén el mismo flujo: valida esta obligación, genera el QR y confirma el pago antes de revisar el comprobante.",
    totalPendingLabel: formatAmount(calculateTotalPending(debts || [])),
    selectedAmountLabel: formatAmount(selectedDebt.amount),
    summaryItems: [
      { key: "provider", label: "Empresa", value: normalizeText(providerName, "Pendiente") },
      { key: "reference", label: "Referencia", value: normalizeText(customerRef, "Pendiente") },
      {
        key: "period",
        label: "Periodo",
        value: normalizeText(selectedDebt.period, "Sin periodo informado"),
      },
      {
        key: "dueDate",
        label: "Vence",
        value: formatDate(selectedDebt.dueDate),
      },
    ],
    nextStepLabel: "Siguiente paso: genera el QR para continuar con el pago.",
  };
}

const PAYMENT_STAGE_MAP = {
  idle: {
    tone: "neutral",
    stageLabel: "Paso 1 de 2",
    title: "Genera el QR para iniciar el pago",
    description:
      "Primero emitiremos un QR único para esta obligación. Después podrás escanearlo y confirmar la transacción.",
    helperLabel: "Todavía no generaste un QR para esta deuda.",
    primaryActionLabel: "Generar QR de pago",
    secondaryActionLabel: "",
    busyLabel: "",
    canGenerateQr: true,
    canConfirmPayment: false,
    canReset: false,
    showQrCard: false,
  },
  generating: {
    tone: "info",
    stageLabel: "Paso 1 de 2",
    title: "Estamos generando tu QR de pago",
    description:
      "Espera unos segundos mientras preparamos el código QR asociado a esta obligación.",
    helperLabel: "No cierres esta pantalla hasta que el QR aparezca.",
    primaryActionLabel: "",
    secondaryActionLabel: "",
    busyLabel: "Generando QR...",
    canGenerateQr: false,
    canConfirmPayment: false,
    canReset: false,
    showQrCard: false,
  },
  qr_ready: {
    tone: "info",
    stageLabel: "Paso 2 de 2",
    title: "Escanea el QR y confirma el pago",
    description:
      "Usa tu banca o billetera para pagar esta obligación. Cuando termines, confirma la transacción para pasar al comprobante del mismo flujo.",
    primaryActionLabel: "Confirmar pago",
    secondaryActionLabel: "Generar un nuevo QR",
    busyLabel: "",
    canGenerateQr: false,
    canConfirmPayment: true,
    canReset: true,
    showQrCard: true,
  },
  confirming: {
    tone: "info",
    stageLabel: "Paso 2 de 2",
    title: "Estamos validando tu pago",
    description:
      "Estamos confirmando la transacción con el proveedor para llevarte al comprobante interno.",
    helperLabel: "No cierres esta pantalla hasta recibir la confirmación.",
    primaryActionLabel: "",
    secondaryActionLabel: "",
    busyLabel: "Confirmando pago...",
    canGenerateQr: false,
    canConfirmPayment: false,
    canReset: false,
    showQrCard: true,
  },
  success: {
    tone: "success",
    stageLabel: "Completado",
    title: "Pago confirmado correctamente",
    description:
      "La obligación ya fue confirmada. Ahora puedes revisar el comprobante interno y, si lo necesitas, abrir el respaldo oficial.",
    helperLabel: "Comprobante listo para consulta.",
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
    stageLabel: "Requiere atención",
    title: "Necesitamos reintentar este pago",
    description:
      "No pudimos completar este paso. Revisa el mensaje y vuelve a generar el flujo de pago cuando estés listo.",
    primaryActionLabel: "Intentar nuevamente",
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
      stageLabel: "Pendiente",
      title: "Selecciona una deuda para habilitar el pago",
      description:
        "Cuando elijas una obligación, aquí verás el estado del QR, la confirmación y el acceso al comprobante.",
      helperLabel: "El panel de pago se activará automáticamente con tu selección.",
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

  return {
    ...stage,
    helperLabel:
      paymentStep === "qr_ready"
        ? `Transacción activa: ${transactionId || "pendiente"}`
        : paymentStep === "error"
          ? normalizeText(paymentError, "No pudimos continuar con este pago.")
          : stage.helperLabel,
  };
}
