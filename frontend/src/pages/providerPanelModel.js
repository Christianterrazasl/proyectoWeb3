export function buildProviderCompanyOptions(accessibleCompanies = []) {
  return accessibleCompanies.reduce((options, company) => {
    if (!company?.id || !company?.name) {
      return options;
    }

    options.push({
      id: company.id,
      label: company.name,
    });

    return options;
  }, []);
}

export function mapProviderDebtToRow(debt) {
  const status = String(debt?.status || "").toUpperCase();

  return {
    id: debt?.id,
    documento: debt?.customerRef,
    concepto: debt?.serviceId,
    monto: debt?.amount,
    fecha: debt?.dueDate ? String(debt.dueDate).slice(0, 10) : "—",
    estado: status === "PAID" ? "pagada" : "pendiente",
  };
}

export function getProviderScopedEmptyState({
  activeCompanyName,
  tab,
} = {}) {
  const companyName = activeCompanyName || "la empresa activa";
  const debtState = tab === "pagadas" ? "pagadas" : "pendientes";

  return `No hay deudas ${debtState} para ${companyName}.`;
}
