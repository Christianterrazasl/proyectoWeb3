export function slugifyDebtServiceId(value, fallbackCompanyId = "manual") {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 50);

  return slug || `manual_${fallbackCompanyId}`;
}

export function buildAdminDebtPayload({
  activeCompanyId,
  documento,
  concepto,
  monto,
  fecha,
}) {
  return {
    tenantId: String(activeCompanyId),
    serviceId: slugifyDebtServiceId(concepto, activeCompanyId),
    customerRef: String(documento || "").trim(),
    period: String(fecha || "").slice(0, 7),
    amount: Number(monto),
    dueDate: `${fecha}T00:00:00.000Z`,
  };
}

export function mapAdminDebtToRow(debt) {
  const status = String(debt?.status || "").toUpperCase();

  return {
    id: debt?.id,
    documento: debt?.customerRef || "—",
    concepto: debt?.serviceId || "Servicio manual",
    monto: Number(debt?.amount || 0),
    fecha: debt?.dueDate ? String(debt.dueDate).slice(0, 10) : "—",
    estado:
      status === "PAID"
        ? "pagada"
        : status === "PENDING"
          ? "pendiente"
          : status.toLowerCase() || "sin estado",
  };
}

export function filterAdminDebtRows(rows, tab) {
  return rows.filter((row) =>
    tab === "pagadas" ? row.estado === "pagada" : row.estado === "pendiente",
  );
}
