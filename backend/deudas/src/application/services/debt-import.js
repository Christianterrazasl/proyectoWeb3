const { buildDebtPayload, normalizeInput } = require("./debt-payload");

const IMPORT_REQUIRED_COLUMNS = ["tenantId", "serviceId", "customerRef", "period", "amount", "dueDate", "status"];

function splitCsvRow(line) {
  return String(line)
    .split(",")
    .map((value) => value.trim());
}

function parseDebtImportCsv(csvContent) {
  if (typeof csvContent !== "string" || !csvContent.trim()) {
    return { error: "El archivo CSV es obligatorio" };
  }

  const lines = csvContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { error: "El archivo CSV debe incluir encabezados y al menos una fila de datos" };
  }

  const headers = splitCsvRow(lines[0]);
  const hasExpectedHeaders =
    headers.length === IMPORT_REQUIRED_COLUMNS.length &&
    headers.every((header, index) => header === IMPORT_REQUIRED_COLUMNS[index]);

  if (!hasExpectedHeaders) {
    return {
      error: `Los encabezados del CSV deben ser exactamente: ${IMPORT_REQUIRED_COLUMNS.join(", ")}`,
    };
  }

  const debts = [];

  for (let index = 1; index < lines.length; index += 1) {
    const rowNumber = index + 1;
    const values = splitCsvRow(lines[index]);

    if (values.length !== IMPORT_REQUIRED_COLUMNS.length) {
      return {
        error: `La fila ${rowNumber} no respeta el contrato CSV de ${IMPORT_REQUIRED_COLUMNS.length} columnas`,
        totalRecords: debts.length,
      };
    }

    const row = Object.fromEntries(IMPORT_REQUIRED_COLUMNS.map((column, columnIndex) => [column, values[columnIndex]]));
    const payload = buildDebtPayload(row, { requireAllFields: true });

    if (payload.error) {
      return {
        error: `La fila ${rowNumber} es inválida: ${payload.error}`,
        totalRecords: debts.length,
      };
    }

    debts.push(payload.data);
  }

  return { data: debts };
}

async function findInactiveOrMissingProviderTenantId(providerRepository, tenantIds) {
  const uniqueTenantIds = [...new Set(tenantIds.map(normalizeInput).filter(Boolean))];

  if (uniqueTenantIds.length === 0) {
    return null;
  }

  const activeProviders = await providerRepository.findMany({
    where: {
      active: true,
      tenant_id: { in: uniqueTenantIds },
    },
  });
  const activeTenantIds = new Set(activeProviders.map((provider) => normalizeInput(provider.tenant_id)));

  return uniqueTenantIds.find((tenantId) => !activeTenantIds.has(tenantId)) || null;
}

async function ensureActiveProviderExists(providerRepository, tenantId) {
  const normalizedTenantId = normalizeInput(tenantId);

  if (!normalizedTenantId) {
    return { error: "El proveedor de la deuda es obligatorio" };
  }

  const provider = await providerRepository.findUnique({
    where: { tenant_id: normalizedTenantId },
  });

  if (!provider || !provider.active) {
    return {
      error: `Debe existir un proveedor activo para tenantId ${normalizedTenantId}`,
    };
  }

  return null;
}

async function validateImportedDebtProviders(providerRepository, debts) {
  const missingTenantId = await findInactiveOrMissingProviderTenantId(
    providerRepository,
    debts.map((debt) => debt.tenant_id),
  );

  if (!missingTenantId) {
    return null;
  }

  const invalidRowIndex = debts.findIndex((debt) => debt.tenant_id === missingTenantId);

  return {
    error: `La fila ${invalidRowIndex + 2} es inválida: debe existir un proveedor activo para tenantId ${missingTenantId}`,
  };
}

async function createImportSummary(importRepository, data) {
  if (!importRepository?.create) {
    return null;
  }

  return importRepository.create({ data });
}

function getImportedRecordsForSummary({ status, importedRecords }) {
  return status === "COMPLETED" ? importedRecords : 0;
}

async function persistDebtImport(prismaClient, { filename, debts }) {
  const executeImport = async (client) => {
    const importResult = await client.debt.createMany({
      data: debts,
    });
    const importSummary = await createImportSummary(client.import, {
      filename,
      total_records: getImportedRecordsForSummary({
        status: "COMPLETED",
        importedRecords: importResult.count,
      }),
      status: "COMPLETED",
    });

    return { importResult, importSummary };
  };

  if (typeof prismaClient?.$transaction === "function") {
    return prismaClient.$transaction(executeImport);
  }

  return executeImport(prismaClient);
}

module.exports = {
  createImportSummary,
  ensureActiveProviderExists,
  getImportedRecordsForSummary,
  parseDebtImportCsv,
  persistDebtImport,
  validateImportedDebtProviders,
};
