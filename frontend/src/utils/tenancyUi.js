const COMPANY_STATUS_LABELS = {
  APPROVED: "Aprobada",
  PENDING: "Pendiente",
  REJECTED: "Rechazada",
  SUSPENDED: "Suspendida",
};

export function getCompanyStatusLabel(status) {
  if (!status) return "Sin estado";
  return COMPANY_STATUS_LABELS[status] ?? status;
}

// El frontend necesita una única forma de decidir qué tenant mostrar como activo.
// Si el backend no marca uno explícitamente, usamos la primera empresa accesible.
export function getActiveCompany(accessibleCompanies = [], activeCompanyId = null) {
  if (!Array.isArray(accessibleCompanies) || accessibleCompanies.length === 0) {
    return null;
  }

  return (
    accessibleCompanies.find((company) => company.id === activeCompanyId) ??
    accessibleCompanies[0]
  );
}

export function buildTenancyCompanies(
  accessibleCompanies = [],
  memberships = [],
  activeCompanyId = null,
) {
  // Unimos las companies con sus memberships para que la UI no tenga que
  // reconstruir esta relación en cada pantalla.
  const membershipsByCompanyId = new Map(
    memberships.map((membership) => [membership.company_id, membership]),
  );

  return accessibleCompanies.map((company) => {
    const membership = membershipsByCompanyId.get(company.id);

    return {
      ...company,
      isActiveCompany: company.id === activeCompanyId,
      companyRole: membership?.company_role ?? company.membership_role ?? "sin_rol",
      membershipActive: membership?.active ?? false,
    };
  });
}
