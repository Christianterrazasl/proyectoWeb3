const { mapAdminDebt } = require("../../application/mappers/debt-presenters");
const {
  buildDebtPayload,
  isPrismaNotFoundError,
  isValidDebtStatus,
  normalizeInput,
  parseDebtId,
} = require("../../application/services/debt-payload");
const {
  createImportSummary,
  ensureActiveProviderExists,
  getImportedRecordsForSummary,
  parseDebtImportCsv,
  persistDebtImport,
  validateImportedDebtProviders,
} = require("../../application/services/debt-import");

const { requireProviderSession } = require("../middleware/requireProviderSession");

function registerAdminDebtRoutes(app, {
  prismaClient,
  requireProviderSessionMiddleware = requireProviderSession,
}) {
  const withProvider = (handler) => [requireProviderSessionMiddleware, handler];

  app.get("/admin/debts", ...withProvider(async (req, res) => {
    const status = normalizeInput(req.query?.status).toUpperCase() || undefined;
    const tenantId = req.tenantId;

    try {
      const debts = await prismaClient.debt.findMany({
        where: {
          tenant_id: tenantId,
          ...(status ? { status } : {}),
        },
        orderBy: { due_date: "desc" },
      });

      res.json({
        success: true,
        data: debts.map(mapAdminDebt),
      });
    } catch (error) {
      console.error("GET /admin/debts", error);
      res.status(500).json({
        success: false,
        message: "No se pudieron listar las deudas del proveedor",
      });
    }
  }));

  app.post("/admin/debts", ...withProvider(async (req, res) => {
    const payload = buildDebtPayload(
      { ...req.body, tenantId: req.tenantId },
      { requireAllFields: true },
    );

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
  }));

  app.patch("/admin/debts/:id", ...withProvider(async (req, res) => {
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
  }));

  app.patch("/admin/debts/:id/status", ...withProvider(async (req, res) => {
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
  }));

  app.post("/admin/debts/import", ...withProvider(async (req, res) => {
    const filename = normalizeInput(req.body?.filename);
    const csvContent = req.body?.csvContent;

    if (!filename) {
      return res.status(400).json({
        success: false,
        message: "El nombre del archivo importado es obligatorio",
      });
    }

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
        parsedImport.data.map((row) => ({ ...row, tenant_id: req.tenantId })),
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
        debts: parsedImport.data.map((row) => ({
          ...row,
          tenant_id: req.tenantId,
        })),
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
  }));
}

module.exports = { registerAdminDebtRoutes };
