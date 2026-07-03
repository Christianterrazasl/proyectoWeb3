export function buildCatalogServiceOptions(services = []) {
  return services.reduce((options, service) => {
    const id = String(service?.serviceId || service?.id || "").trim();
    const label = String(service?.serviceName || service?.name || id).trim();

    if (!id || !label) {
      return options;
    }

    options.push({ id, label });
    return options;
  }, []);
}

export function buildAdminDebtPayload({
  activeCompanyId,
  serviceId,
  documento,
  monto,
  fecha,
}) {
  return {
    tenantId: String(activeCompanyId),
    serviceId: String(serviceId || "").trim(),
    customerRef: String(documento || "").trim(),
    period: String(fecha || "").slice(0, 7),
    amount: Number(monto),
    dueDate: `${fecha}T00:00:00.000Z`,
  };
}

export function mapAdminDebtToRow(debt) {
  const status = String(debt?.status || "").toUpperCase();
  const serviceId = String(debt?.serviceId || "").trim();

  return {
    id: debt?.id,
    documento: debt?.customerRef || "—",
    concepto: serviceId || "—",
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
