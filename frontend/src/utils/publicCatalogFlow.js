const PUBLIC_ALL_CATEGORIES = "__all__";

export function normalizeCatalogText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function buildCompanyDirectory(services) {
  const companiesMap = new Map();

  services.forEach((service) => {
    const companyId = String(service.companyId || "").trim();
    const companyName = String(service.companyName || "").trim();

    if (!companyId || !companyName) {
      return;
    }

    const currentCompany = companiesMap.get(companyId) || {
      id: companyId,
      tenantId: companyId,
      name: companyName,
      category: service.category || "",
      description: service.description || "",
      logoUrl: service.logoUrl || "",
      services: [],
    };

    currentCompany.services.push(service);

    if (!currentCompany.category && service.category) {
      currentCompany.category = service.category;
    }

    if (!currentCompany.description && service.description) {
      currentCompany.description = service.description;
    }

    if (!currentCompany.logoUrl && service.logoUrl) {
      currentCompany.logoUrl = service.logoUrl;
    }

    companiesMap.set(companyId, currentCompany);
  });

  return Array.from(companiesMap.values()).sort((left, right) =>
    left.name.localeCompare(right.name, "es", { sensitivity: "base" }),
  );
}

export function deriveCompanyCategories(companies) {
  return Array.from(
    new Set(companies.map((company) => company.category).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right, "es"));
}

export function filterCompaniesByCategoryAndQuery({
  companies,
  activeCategory,
  searchTerm,
}) {
  const normalizedQuery = normalizeCatalogText(searchTerm);

  return companies.filter((company) => {
    const matchesCategory =
      activeCategory === PUBLIC_ALL_CATEGORIES ||
      company.category === activeCategory;

    if (!matchesCategory) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const searchableText = normalizeCatalogText(
      [
        company.name,
        company.category,
        company.description,
        ...company.services.map((service) => service.name),
      ].join(" "),
    );

    return searchableText.includes(normalizedQuery);
  });
}

export function findCompanyById(companies, selectedCompanyId) {
  return companies.find((company) => company.id === selectedCompanyId) || null;
}

export function findServiceById(selectedCompany, selectedServiceId) {
  return (
    selectedCompany?.services.find((service) => service.id === selectedServiceId) ||
    null
  );
}

export function buildPublicPaymentRoute({ selectedService, customerRef }) {
  const normalizedCustomerRef = String(customerRef || "").trim();

  if (!selectedService?.companyId || !normalizedCustomerRef) {
    return "";
  }

  return `/deuda/${encodeURIComponent(selectedService.companyId)}?customerRef=${encodeURIComponent(normalizedCustomerRef)}`;
}

export function buildLookupFieldConfig(selectedService) {
  const inputSchema = selectedService?.inputSchema || {};
  const inputLabel =
    inputSchema.label || inputSchema.title || "Referencia del cliente";

  return {
    inputLabel,
    inputType: inputSchema.type || "text",
    inputPlaceholder:
      inputSchema.placeholder || `Ej: Ingrese su ${inputLabel.toLowerCase()}`,
  };
}

export { PUBLIC_ALL_CATEGORIES };
