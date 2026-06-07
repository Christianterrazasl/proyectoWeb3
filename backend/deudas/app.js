const express = require("express");
const cors = require("cors");

const VALID_DEBT_STATUSES = new Set(["PENDING", "PAID", "CANCELLED"]);
const IMPORT_REQUIRED_COLUMNS = ["tenantId", "serviceId", "customerRef", "period", "amount", "dueDate", "status"];

function mapProvider(provider) {
  return {
    id: String(provider.id),
    name: provider.name,
    description: provider.description,
    image: provider.image_url,
    idProveedor: provider.tenant_id,
  };
}

function mapPublicDebt(debt) {
  return {
    id: String(debt.id),
    serviceId: debt.service_id,
    period: debt.period,
    amount: debt.amount,
    dueDate: debt.due_date instanceof Date ? debt.due_date.toISOString() : debt.due_date,
    status: debt.status,
  };
}

function normalizeInput(value) {
  return String(value || "").trim();
}

function mapAdminDebt(debt) {
  return {
    id: String(debt.id),
    serviceId: debt.service_id,
    period: debt.period,
    amount: debt.amount,
    dueDate: debt.due_date instanceof Date ? debt.due_date.toISOString() : debt.due_date,
    status: debt.status,
  };
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

function splitCsvRow(line) {
  // Contrato acotado: el panel administrativo envía un CSV ya normalizado,
  // sin comas escapadas ni columnas anidadas. Eso mantiene la importación simple y verificable.
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

  // En escrituras exigimos proveedor activo para no crear deudas huérfanas
  // ni seguir asignando operaciones a un tenant que ya se retiró del catálogo.
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
    // Si Prisma expone transacciones, el lote y su resumen se confirman juntos
    // o se revierten juntos para no dejar imports "COMPLETED" sin deudas persistidas.
    return prismaClient.$transaction(executeImport);
  }

  // Fallback para dobles de prueba o clientes mínimos: mantiene el mismo flujo
  // sin cambiar el contrato HTTP, aunque sin garantías de rollback real.
  return executeImport(prismaClient);
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

function createApp({ prismaClient }) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ service: "deudas", status: "ok" });
  });

  app.get("/debts", async (req, res) => {
    try {
      const { customer_ref, tenant_id, status } = req.query;
      const debts = await prismaClient.debt.findMany({
        where: {
          ...(customer_ref ? { customer_ref: String(customer_ref) } : {}),
          ...(tenant_id ? { tenant_id: String(tenant_id) } : {}),
          ...(status ? { status } : {}),
        },
        orderBy: { due_date: "asc" },
      });

      res.json(debts);
    } catch (error) {
      console.error("GET /debts", error);
      res.status(500).json({ message: "No se pudieron obtener las deudas" });
    }
  });

  app.get("/debts/providers", async (_req, res) => {
    try {
      const providers = await prismaClient.provider.findMany({
        where: { active: true },
        orderBy: { sort_order: "asc" },
      });

      res.json({
        success: true,
        data: providers.map(mapProvider),
      });
    } catch (error) {
      console.error("GET /debts/providers", error);
      res.status(500).json({
        success: false,
        message: "No se pudo obtener el catálogo de proveedores",
      });
    }
  });

  // Las rutas públicas exponen solo lectura y devuelven únicamente deudas pendientes.
  // Las mutaciones viven bajo /admin para separar el consumo ciudadano del backoffice.
  app.get("/debts/providers/:tenantId/customers/:customerRef", async (req, res) => {
    const tenantId = normalizeInput(req.params?.tenantId);
    const customerRef = normalizeInput(req.params?.customerRef);

    if (!tenantId || !customerRef) {
      return res.status(400).json({
        success: false,
        message: "El proveedor y el identificador del cliente son obligatorios",
      });
    }

    if (!isValidPublicIdentifier(tenantId) || !isValidPublicIdentifier(customerRef)) {
      return res.status(400).json({
        success: false,
        message: "El proveedor o el identificador del cliente tienen un formato inválido",
      });
    }

    try {
      const provider = await prismaClient.provider.findUnique({
        where: { tenant_id: tenantId },
      });

      if (!provider || !provider.active) {
        return res.status(404).json({
          success: false,
          message: "No se encontró un proveedor público para la consulta solicitada",
        });
      }

      const debts = await prismaClient.debt.findMany({
        where: {
          tenant_id: tenantId,
          customer_ref: customerRef,
          status: "PENDING",
        },
        orderBy: { due_date: "asc" },
      });

      res.json({
        success: true,
        data: {
          provider: mapProvider(provider),
          customerRef,
          debts: debts.map(mapPublicDebt),
        },
        meta: {
          tenantId,
          totalDebts: debts.length,
        },
      });
    } catch (error) {
      console.error("GET /debts/providers/:tenantId/customers/:customerRef", error);
      res.status(500).json({
        success: false,
        message: "No se pudieron obtener las deudas del cliente",
      });
    }
  });

  app.post("/admin/debts", async (req, res) => {
    const payload = buildDebtPayload(req.body, { requireAllFields: true });

    if (payload.error) {
      return res.status(400).json({
        success: false,
        message: payload.error,
      });
    }

    try {
      const providerValidationError = await ensureActiveProviderExists(
        prismaClient.provider,
        payload.data.tenant_id,
      );

      if (providerValidationError) {
        return res.status(400).json({
          success: false,
          message: providerValidationError.error,
        });
      }

      const debt = await prismaClient.debt.create({
        // La ruta administrativa trabaja con el contrato HTTP público del servicio,
        // pero persiste usando el shape snake_case esperado por Prisma.
        data: payload.data,
      });

      res.status(201).json({
        success: true,
        data: mapAdminDebt(debt),
      });
    } catch (error) {
      console.error("POST /admin/debts", error);
      res.status(500).json({
        success: false,
        message: "No se pudo crear la deuda",
      });
    }
  });

  app.patch("/admin/debts/:id", async (req, res) => {
    const debtId = parseDebtId(req.params?.id);

    if (!debtId) {
      return res.status(400).json({
        success: false,
        message: "El identificador de la deuda es inválido",
      });
    }

    const payload = buildDebtPayload(req.body, { allowStatus: false });

    if (payload.error) {
      return res.status(400).json({
        success: false,
        message: payload.error,
      });
    }

    try {
      if (payload.data.tenant_id !== undefined) {
        const providerValidationError = await ensureActiveProviderExists(
          prismaClient.provider,
          payload.data.tenant_id,
        );

        if (providerValidationError) {
          return res.status(400).json({
            success: false,
            message: providerValidationError.error,
          });
        }
      }

      const debt = await prismaClient.debt.update({
        where: { id: debtId },
        data: payload.data,
      });

      res.json({
        success: true,
        data: mapAdminDebt(debt),
      });
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        return res.status(404).json({
          success: false,
          message: "No se encontró la deuda solicitada",
        });
      }

      console.error("PATCH /admin/debts/:id", error);
      res.status(500).json({
        success: false,
        message: "No se pudo actualizar la deuda",
      });
    }
  });

  app.patch("/admin/debts/:id/status", async (req, res) => {
    const debtId = parseDebtId(req.params?.id);
    const status = normalizeInput(req.body?.status).toUpperCase();

    if (!debtId) {
      return res.status(400).json({
        success: false,
        message: "El identificador de la deuda es inválido",
      });
    }

    if (!isValidDebtStatus(status)) {
      return res.status(400).json({
        success: false,
        message: "El estado de la deuda es inválido",
      });
    }

    try {
      const debt = await prismaClient.debt.update({
        where: { id: debtId },
        // El cambio de estado va aislado para no mezclar mutaciones operativas
        // con la edición de datos comerciales de la deuda.
        data: { status },
      });

      res.json({
        success: true,
        data: mapAdminDebt(debt),
      });
    } catch (error) {
      if (isPrismaNotFoundError(error)) {
        return res.status(404).json({
          success: false,
          message: "No se encontró la deuda solicitada",
        });
      }

      console.error("PATCH /admin/debts/:id/status", error);
      res.status(500).json({
        success: false,
        message: "No se pudo actualizar el estado de la deuda",
      });
    }
  });

  app.post("/admin/debts/import", async (req, res) => {
    const filename = normalizeInput(req.body?.filename);
    const csvContent = req.body?.csvContent;

    if (!filename) {
      return res.status(400).json({
        success: false,
        message: "El nombre del archivo importado es obligatorio",
      });
    }

    // El import sigue un contrato deliberadamente cerrado: encabezados exactos,
    // columnas fijas y validación fila por fila para detectar rápido en qué punto se rompe el lote.
    const parsedImport = parseDebtImportCsv(csvContent);

    if (parsedImport.error) {
      if (typeof parsedImport.totalRecords === "number") {
        await createImportSummary(prismaClient.import, {
          filename,
          total_records: getImportedRecordsForSummary({
            status: "FAILED",
            importedRecords: parsedImport.totalRecords,
          }),
          status: "FAILED",
        });
      }

      return res.status(400).json({
        success: false,
        message: parsedImport.error,
      });
    }

    try {
      const providerValidationError = await validateImportedDebtProviders(
        prismaClient.provider,
        parsedImport.data,
      );

      if (providerValidationError) {
        await createImportSummary(prismaClient.import, {
          filename,
          total_records: 0,
          status: "FAILED",
        });

        return res.status(400).json({
          success: false,
          message: providerValidationError.error,
        });
      }

      const { importResult, importSummary } = await persistDebtImport(prismaClient, {
        filename,
        debts: parsedImport.data,
      });

      res.status(201).json({
        success: true,
        data: {
          importId: importSummary ? String(importSummary.id) : null,
          filename,
          totalRecords: parsedImport.data.length,
          importedRecords: importResult.count,
          status: importSummary?.status || "COMPLETED",
        },
      });
    } catch (error) {
      console.error("POST /admin/debts/import", error);
      res.status(500).json({
        success: false,
        message: "No se pudo importar el lote de deudas",
      });
    }
  });

  app.post("/debts/lookup", async (req, res) => {
    const customerRef = normalizeInput(req.body?.customerRef);
    const serviceId = req.body?.serviceId
      ? normalizeInput(req.body.serviceId)
      : undefined;

    if (!customerRef) {
      return res.status(400).json({
        success: false,
        message: "El identificador del cliente es obligatorio",
      });
    }

    try {
      const debts = await prismaClient.debt.findMany({
        where: {
          customer_ref: customerRef,
          status: "PENDING",
          ...(serviceId ? { service_id: serviceId } : {}),
        },
        orderBy: { due_date: "asc" },
      });

      const tenantIds = [...new Set(debts.map((debt) => debt.tenant_id))];

      const providers = await prismaClient.provider.findMany({
        where: {
          active: true,
          tenant_id: { in: tenantIds },
        },
        orderBy: { sort_order: "asc" },
      });

      res.json({
        success: true,
        data: providers.map(mapProvider),
        meta: {
          customerRef,
          totalProviders: providers.length,
          totalDebts: debts.length,
        },
      });
    } catch (error) {
      console.error("POST /debts/lookup", error);
      res.status(500).json({
        success: false,
        message: "No se pudo realizar la búsqueda de deudas",
      });
    }
  });

  return app;
}

module.exports = {
  buildDebtPayload,
  createApp,
  mapAdminDebt,
  mapProvider,
  mapPublicDebt,
  parseDebtImportCsv,
  isValidPublicIdentifier,
  isValidDebtStatus,
  parseDebtId,
};
