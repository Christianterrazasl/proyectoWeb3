function normalizeCompanyName(activeCompanyName) {
  return activeCompanyName || "la empresa activa";
}

export function buildAdminExportActions() {
  return [
    { key: "companies-csv", label: "Empresas CSV", format: "csv", resource: "companies" },
    { key: "companies-xlsx", label: "Empresas XLSX", format: "xlsx", resource: "companies" },
    { key: "services-csv", label: "Servicios CSV", format: "csv", resource: "services" },
    { key: "services-xlsx", label: "Servicios XLSX", format: "xlsx", resource: "services" },
    { key: "transactions-csv", label: "Transacciones CSV", format: "csv", resource: "transactions" },
    { key: "transactions-xlsx", label: "Transacciones XLSX", format: "xlsx", resource: "transactions" },
  ];
}

export async function readAdminDebtImportFile(file) {
  if (!file?.name || typeof file.text !== "function") {
    throw new Error("Selecciona un archivo CSV para importar");
  }

  const csvContent = await file.text();

  if (!String(csvContent || "").trim()) {
    throw new Error("El archivo CSV está vacío");
  }

  return {
    filename: file.name,
    csvContent,
  };
}

export function buildAdminDebtImportSuccessMessage({
  filename,
  importedRecords,
  totalRecords,
} = {}) {
  const safeFilename = filename || "el archivo CSV";
  const imported = Number(importedRecords || 0);
  const total = Number(totalRecords || 0);

  return `Importación completada: ${imported} de ${total} registros cargados desde "${safeFilename}".`;
}

export function buildAdminExportSuccessMessage({
  filename,
  activeCompanyName,
} = {}) {
  const companyName = normalizeCompanyName(activeCompanyName);
  const safeFilename = filename || "el archivo exportado";
  return `Descarga iniciada: "${safeFilename}" para ${companyName}.`;
}

export function getAdminEmptyState({
  section,
  activeCompanyName,
  debtTab,
} = {}) {
  const companyName = normalizeCompanyName(activeCompanyName);

  switch (section) {
    case "debts": {
      const debtState = debtTab === "pagadas" ? "pagadas" : "pendientes";
      return `No hay deudas ${debtState} para ${companyName}. Importa un CSV o crea una deuda manual para continuar.`;
    }
    case "providers":
      return "Todavía no hay proveedores activos registrados. Crea uno para habilitar operaciones reales.";
    case "portfolio":
      return `Todavía no hay cartera consolidada para ${companyName}. Importa deudas o espera actividad real para verla aquí.`;
    case "transactions":
      return `Todavía no hay transacciones reales para ${companyName}. Cuando existan pagos, aparecerán aquí.`;
    case "services":
      return `No hay servicios de catálogo para ${companyName}. Sincroniza el catálogo antes de crear o importar deudas.`;
    default:
      return `Todavía no hay datos reales para ${companyName}.`;
  }
}
