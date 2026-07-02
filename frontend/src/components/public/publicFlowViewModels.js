const HERO_DESCRIPTION_FALLBACK =
  "Selecciona el servicio que corresponda y luego ingresa la referencia del cliente para consultar las deudas disponibles.";

const SERVICE_DESCRIPTION_FALLBACK =
  "Este servicio está disponible para consulta pública dentro del catálogo actual.";

const CATALOG_DEFAULT_DESCRIPTION =
  "Comienza por la empresa que deseas consultar. Luego podrás elegir el servicio y escribir la referencia exacta del cliente.";

function normalizeText(value) {
  return String(value || "").trim();
}

function countVisibleServices(companies) {
  return companies.reduce(
    (total, company) => total + (company.services?.length || 0),
    0,
  );
}

function formatPeriodsRange(debts) {
  const periods = debts
    .map((debt) => normalizeText(debt.period))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right, "es"));

  if (!periods.length) {
    return "Sin periodo informado";
  }

  return periods.length === 1
    ? periods[0]
    : `${periods[0]} a ${periods[periods.length - 1]}`;
}

const CATALOG_LOADING_STATE = {
  variant: "loading",
  title: "Cargando empresas",
};

const CATALOG_ERROR_TITLE = "Error al cargar el catálogo";

const CATALOG_EMPTY_STATE = {
  variant: "empty",
  title: "Sin resultados",
};

export function buildPublicCatalogBrowserState({
  loadingCatalog,
  catalogError,
  filteredCompanies,
}) {
  const matches = filteredCompanies.length;

  if (loadingCatalog) {
    return {
      matchCountLabel: `${matches} coincidencia(s)`,
      contentState: CATALOG_LOADING_STATE,
    };
  }

  if (catalogError) {
    return {
      matchCountLabel: `${matches} coincidencia(s)`,
      contentState: {
        variant: "error",
        title: CATALOG_ERROR_TITLE,
        description: catalogError,
      },
    };
  }

  if (matches === 0) {
    return {
      matchCountLabel: "0 coincidencia(s)",
      contentState: CATALOG_EMPTY_STATE,
    };
  }

  return {
    matchCountLabel: `${matches} coincidencia(s)`,
    contentState: null,
  };
}

export function buildPublicCatalogGuidance({
  totalCompanies,
  totalServices,
  filteredCompanies,
  activeCategory,
  searchTerm,
}) {
  const normalizedSearchTerm = normalizeText(searchTerm);
  const normalizedCategory = normalizeText(activeCategory);
  const hasCategoryFilter = normalizedCategory && normalizedCategory !== "__all__";
  const hasSearchFilter = Boolean(normalizedSearchTerm);
  const visibleServices = countVisibleServices(filteredCompanies);
  const visibleCompanies = filteredCompanies.length;

  if (!hasCategoryFilter && !hasSearchFilter) {
    return {
      title: "Explora el catálogo público completo",
      description: CATALOG_DEFAULT_DESCRIPTION,
      matchCountLabel: `${visibleCompanies} empresas / ${visibleServices} servicios visibles`,
      badges: [
        `${totalCompanies} empresas en catálogo`,
        `${totalServices} servicios publicados`,
      ],
    };
  }

  const descriptionParts = [];

  if (hasCategoryFilter) {
    descriptionParts.push(`Categoria activa: ${normalizedCategory}.`);
  }

  if (hasSearchFilter) {
    descriptionParts.push(`Busqueda actual: "${normalizedSearchTerm}".`);
  }

  descriptionParts.push(
    "Revisa las opciones disponibles y elige una empresa para continuar con sus servicios.",
  );

  return {
    title: `Explora ${visibleCompanies} empresas filtradas`,
    description: descriptionParts.join(" "),
    matchCountLabel: `${visibleCompanies} empresas / ${visibleServices} servicios visibles`,
    badges: [
      `${totalCompanies} empresas en catálogo`,
      `${totalServices} servicios publicados`,
    ],
  };
}

export function buildSelectedCompanyHeroModel({
  category,
  companyName,
  description,
  servicesCount,
}) {
  return {
    categoryLabel: category || "Catálogo público",
    companyName,
    description: description || HERO_DESCRIPTION_FALLBACK,
    stats: [
      { key: "company", label: "Empresa", value: companyName },
      { key: "services", label: "Servicios", value: servicesCount },
    ],
  };
}

export function buildPublicServiceOptions({
  companyName,
  services,
  selectedServiceId,
}) {
  return services.map((service) => ({
    id: service.id,
    companyName,
    name: service.name,
    description: service.description || SERVICE_DESCRIPTION_FALLBACK,
    selected: selectedServiceId === service.id,
    statusLabel:
      selectedServiceId === service.id ? "Seleccionado" : "Disponible",
    nextStepLabel:
      selectedServiceId === service.id
        ? "Siguiente: escribe la referencia para consultar deudas"
        : "Haz clic para consultar este servicio",
  }));
}

export function buildPublicLookupPanelModel({
  selectedServiceName,
  inputLabel,
  normalizedCustomerRef,
  canSearch,
  selectedServiceEnabled,
}) {
  if (!selectedServiceEnabled) {
    return {
      statusTone: "disabled",
      readinessLabel:
        "Selecciona un servicio para habilitar el campo y la búsqueda.",
      helperText:
        "Primero elige el servicio correcto. Después podrás ingresar la referencia exacta del cliente.",
    };
  }

  if (canSearch && normalizeText(normalizedCustomerRef)) {
    return {
      statusTone: "ready",
      readinessLabel: `Referencia lista. Ya puedes consultar ${selectedServiceName}.`,
      helperText: `Verifica que el ${inputLabel} coincida con el dato registrado por la empresa antes de buscar.`,
    };
  }

  return {
    statusTone: "pending",
    readinessLabel: `Completa la referencia para consultar ${selectedServiceName}.`,
    helperText: `Usa el mismo ${inputLabel} registrado por la empresa para habilitar la consulta.`,
  };
}

export function buildPublicResultsSummary({
  debts,
  selectedServiceName,
  companyName,
  customerRef,
}) {
  if (!debts.length) {
    return null;
  }

  const totalAmount = debts.reduce(
    (sum, debt) => sum + Number(debt.amount || 0),
    0,
  );

  return {
    title: `Encontramos ${debts.length} deuda(s)`,
    totalAmountLabel: `Bs. ${totalAmount.toFixed(2)}`,
    detailItems: [
      { key: "company", label: "Empresa", value: companyName || "Sin empresa" },
      {
        key: "service",
        label: "Servicio",
        value: selectedServiceName || "Sin servicio",
      },
      {
        key: "reference",
        label: "Referencia",
        value: customerRef || "Sin referencia",
      },
      {
        key: "periods",
        label: "Periodos",
        value: formatPeriodsRange(debts),
      },
    ],
  };
}

export {
  CATALOG_EMPTY_STATE,
  CATALOG_DEFAULT_DESCRIPTION,
  CATALOG_ERROR_TITLE,
  CATALOG_LOADING_STATE,
  HERO_DESCRIPTION_FALLBACK,
  SERVICE_DESCRIPTION_FALLBACK,
};
