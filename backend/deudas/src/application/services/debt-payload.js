const VALID_DEBT_STATUSES = new Set(["PENDING", "PAID", "CANCELLED"]);

function normalizeInput(value) {
  return String(value || "").trim();
}

function isValidPublicIdentifier(value) {
  return /^[A-Za-z0-9._-]{1,50}$/.test(value);
}

function parseDebtId(value) {
  const debtId = Number.parseInt(String(value), 10);

  if (!Number.isInteger(debtId) || debtId <= 0) {
    return null;
  }

  return debtId;
}

function parseAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }

  return amount;
}

function parseDueDate(value) {
  const normalizedValue = normalizeInput(value);

  if (!normalizedValue) {
    return null;
  }

  const dateOnlyMatch = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const dueDate = new Date(`${normalizedValue}T00:00:00.000Z`);

    if (
      Number.isNaN(dueDate.getTime()) ||
      dueDate.getUTCFullYear() !== Number(year) ||
      dueDate.getUTCMonth() + 1 !== Number(month) ||
      dueDate.getUTCDate() !== Number(day)
    ) {
      return null;
    }

    return dueDate;
  }

  const isoUtcMatch = normalizedValue.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(\.\d{3})?)?Z$/,
  );

  if (!isoUtcMatch) {
    return null;
  }

  const dueDate = new Date(value);
  const [, year, month, day, hours, minutes, seconds = "00", milliseconds = ".000"] = isoUtcMatch;

  if (
    Number.isNaN(dueDate.getTime()) ||
    dueDate.getUTCFullYear() !== Number(year) ||
    dueDate.getUTCMonth() + 1 !== Number(month) ||
    dueDate.getUTCDate() !== Number(day) ||
    dueDate.getUTCHours() !== Number(hours) ||
    dueDate.getUTCMinutes() !== Number(minutes) ||
    dueDate.getUTCSeconds() !== Number(seconds) ||
    dueDate.getUTCMilliseconds() !== Number(milliseconds.slice(1))
  ) {
    return null;
  }

  return dueDate;
}

function isValidDebtStatus(value) {
  return VALID_DEBT_STATUSES.has(normalizeInput(value).toUpperCase());
}

function buildDebtPayload(body, { requireAllFields = false, allowStatus = true } = {}) {
  const tenantId = normalizeInput(body?.tenantId);
  const serviceId = normalizeInput(body?.serviceId);
  const customerRef = normalizeInput(body?.customerRef);
  const period = normalizeInput(body?.period);
  const status = body?.status ? normalizeInput(body.status).toUpperCase() : undefined;
  const payload = {};

  if (requireAllFields || body?.tenantId !== undefined) {
    if (!tenantId) {
      return { error: "El proveedor de la deuda es obligatorio" };
    }

    payload.tenant_id = tenantId;
  }

  if (requireAllFields || body?.serviceId !== undefined) {
    if (!serviceId) {
      return { error: "El servicio de la deuda es obligatorio" };
    }

    payload.service_id = serviceId;
  }

  if (requireAllFields || body?.customerRef !== undefined) {
    if (!customerRef) {
      return { error: "El identificador del cliente es obligatorio" };
    }

    payload.customer_ref = customerRef;
  }

  if (requireAllFields || body?.period !== undefined) {
    if (!period) {
      return { error: "El período de la deuda es obligatorio" };
    }

    payload.period = period;
  }

  if (requireAllFields || body?.amount !== undefined) {
    const amount = parseAmount(body?.amount);

    if (amount === null) {
      return { error: "El monto de la deuda debe ser un número válido mayor o igual a cero" };
    }

    payload.amount = amount;
  }

  if (requireAllFields || body?.dueDate !== undefined) {
    const dueDate = parseDueDate(body?.dueDate);

    if (!dueDate) {
      return { error: "La fecha de vencimiento debe tener un formato válido" };
    }

    payload.due_date = dueDate;
  }

  if (body?.status !== undefined) {
    if (!allowStatus) {
      return { error: "El estado de la deuda solo se puede cambiar desde la ruta específica de estado" };
    }

    if (!isValidDebtStatus(status)) {
      return { error: "El estado de la deuda es inválido" };
    }

    payload.status = status;
  } else if (requireAllFields) {
    payload.status = "PENDING";
  }

  if (!requireAllFields && Object.keys(payload).length === 0) {
    return { error: "Debe enviar al menos un campo editable de la deuda" };
  }

  return { data: payload };
}

function isPrismaNotFoundError(error) {
  return error?.code === "P2025";
}

module.exports = {
  buildDebtPayload,
  isPrismaNotFoundError,
  isValidDebtStatus,
  isValidPublicIdentifier,
  normalizeInput,
  parseDebtId,
  parseDueDate,
};
