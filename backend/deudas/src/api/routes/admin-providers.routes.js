const { mapProvider } = require("../../application/mappers/debt-presenters");
const { normalizeInput } = require("../../application/services/debt-payload");
const { requireAdminSession } = require("../middleware/requireAdminSession");

function registerAdminProviderRoutes(app, {
  prismaClient,
  requireAdminSessionMiddleware = requireAdminSession,
}) {
  const withAdmin = (handler) => [requireAdminSessionMiddleware, handler];

  app.get("/admin/providers", ...withAdmin(async (_req, res) => {
    try {
      const providers = await prismaClient.provider.findMany({
        orderBy: [{ active: "desc" }, { sort_order: "asc" }, { name: "asc" }],
      });

      res.json({
        success: true,
        data: providers.map(mapProvider),
      });
    } catch (error) {
      console.error("GET /admin/providers", error);
      res.status(500).json({
        success: false,
        message: "No se pudieron listar los proveedores",
      });
    }
  }));

  app.post("/admin/providers", ...withAdmin(async (req, res) => {
    const tenantId = normalizeInput(req.body?.tenantId);
    const name = normalizeInput(req.body?.name);
    const description =
      normalizeInput(req.body?.description) || "Pago de servicios";
    const imageUrl =
      normalizeInput(req.body?.imageUrl) ||
      normalizeInput(req.body?.image_url) ||
      "https://placehold.net/1.png";
    const sortOrder = Number(req.body?.sortOrder ?? req.body?.sort_order);

    if (!tenantId || !name) {
      return res.status(400).json({
        success: false,
        message: "tenantId y name son obligatorios",
      });
    }

    try {
      const provider = await prismaClient.provider.upsert({
        where: { tenant_id: tenantId },
        update: {
          name,
          description,
          image_url: imageUrl,
          active: true,
          ...(Number.isFinite(sortOrder) ? { sort_order: sortOrder } : {}),
        },
        create: {
          tenant_id: tenantId,
          name,
          description,
          image_url: imageUrl,
          active: true,
          sort_order: Number.isFinite(sortOrder) ? sortOrder : 999,
        },
      });

      res.status(201).json({
        success: true,
        data: mapProvider(provider),
      });
    } catch (error) {
      console.error("POST /admin/providers", error);
      res.status(500).json({
        success: false,
        message: "No se pudo registrar el proveedor",
      });
    }
  }));

  app.delete("/admin/providers/:tenantId", ...withAdmin(async (req, res) => {
    const tenantId = normalizeInput(req.params?.tenantId);

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "El identificador del proveedor es inválido",
      });
    }

    try {
      const provider = await prismaClient.provider.findUnique({
        where: { tenant_id: tenantId },
      });

      if (!provider) {
        return res.status(404).json({
          success: false,
          message: "Proveedor no encontrado",
        });
      }

      await prismaClient.provider.update({
        where: { tenant_id: tenantId },
        data: { active: false },
      });

      res.json({
        success: true,
        data: {
          tenantId,
          active: false,
        },
      });
    } catch (error) {
      console.error("DELETE /admin/providers/:tenantId", error);
      res.status(500).json({
        success: false,
        message: "No se pudo eliminar el proveedor",
      });
    }
  }));
}

module.exports = { registerAdminProviderRoutes };
