export function buildAdminProviderRows(companies = [], providers = []) {
  const providerByTenant = new Map(
    providers.map((provider) => [
      String(provider.tenantId || provider.idProveedor),
      provider,
    ]),
  );

  return companies
    .map((company) => {
      const provider = providerByTenant.get(String(company.id));

      return {
        id: company.id,
        name: company.name,
        nit: company.nit,
        active: company.active !== false,
        status: company.status || "APPROVED",
        hasProviderRegistry: Boolean(provider),
        providerActive: provider?.active !== false,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name, "es"));
}

export function buildCreateProviderNit(name) {
  const normalized = String(name || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20);

  return `NIT-${normalized || "PROV"}-${Date.now().toString().slice(-4)}`;
}
