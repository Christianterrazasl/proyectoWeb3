const { mapProvider, mapPublicDebt } = require("../../application/mappers/debt-presenters");
const {
  isValidPublicIdentifier,
  normalizeInput,
} = require("../../application/services/debt-payload");

function registerPublicDebtRoutes(app, { prismaClient }) {
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

  app.get("/debts/lookup", async (req, res) => {
    const tenantId = normalizeInput(req.query?.tenantId);
    const serviceId = normalizeInput(req.query?.serviceId);
    const customerRef = normalizeInput(req.query?.customerRef);

    if (!tenantId || !serviceId || !customerRef) {
      return res.status(400).json({
        success: false,
        message: "tenantId, serviceId y customerRef son obligatorios",
      });
    }

    try {
      const debt = await prismaClient.debt.findFirst({
        where: {
          tenant_id: tenantId,
          service_id: serviceId,
          customer_ref: customerRef,
          status: "PENDING",
        },
        orderBy: { due_date: "asc" },
      });

      if (!debt) {
        return res.status(404).json({
          success: false,
          message: "No se encontró una deuda pendiente para los datos proporcionados",
        });
      }

      return res.json({
        success: true,
        data: mapPublicDebt(debt),
      });
    } catch (error) {
      console.error("GET /debts/lookup", error);
      return res.status(500).json({
        success: false,
        message: "No se pudo validar la deuda",
      });
    }
  });

  app.patch("/debts/update-status", async (req, res) => {
    const tenantId = normalizeInput(req.body?.tenantId);
    const serviceId = normalizeInput(req.body?.serviceId);
    const customerRef = normalizeInput(req.body?.customerRef);
    const status = normalizeInput(req.body?.status).toUpperCase() || "PAID";

    if (!tenantId || !serviceId || !customerRef) {
      return res.status(400).json({
        success: false,
        message: "tenantId, serviceId y customerRef son obligatorios",
      });
    }

    try {
      const result = await prismaClient.debt.updateMany({
        where: {
          tenant_id: tenantId,
          service_id: serviceId,
          customer_ref: customerRef,
          status: "PENDING",
        },
        data: { status },
      });

      return res.json({
        success: true,
        data: { updated: result.count, status },
      });
    } catch (error) {
      console.error("PATCH /debts/update-status", error);
      return res.status(500).json({
        success: false,
        message: "No se pudo actualizar el estado de la deuda",
      });
    }
  });

  app.post("/debts/lookup", async (req, res) => {
    const customerRef = normalizeInput(req.body?.customerRef);
    const serviceId = req.body?.serviceId ? normalizeInput(req.body.serviceId) : undefined;

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
}

module.exports = { registerPublicDebtRoutes };
