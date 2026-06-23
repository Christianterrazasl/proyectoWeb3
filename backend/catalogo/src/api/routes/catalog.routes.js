import { Router } from "express";
import { CompanyController } from "../controllers/CompanyController.js";
import { CompanyRepositoryImpl } from "../../infrastructure/repositories_impl/CompanyRepositoryImpl.js";
import { ServiceRepositoryImpl } from "../../infrastructure/repositories_impl/ServiceRepositoryImpl.js";
import { requireAdminSession } from "../middleware/requireAdminSession.js";

const router = Router();

/**
 * Wiring simple del módulo catálogo.
 */
const companyRepository = new CompanyRepositoryImpl();
const serviceRepository = new ServiceRepositoryImpl();
const controller = new CompanyController(companyRepository, serviceRepository);

// Escritura admin protegida
router.post("/admin/services", requireAdminSession, (req, res) =>
  controller.createService(req, res),
);

// Lectura admin protegida para reportes/panel
router.get("/admin/services", requireAdminSession, (req, res) =>
  controller.listAdminServices(req, res),
);

// Catálogo público
router.get("/catalog/services", (req, res) => controller.getPublicCatalog(req, res));

// --- Edición ---
router.put(
  "/companies/:id",
  controller.updateCompany.bind(controller),
);
router.put(
  "/services/:id",
  controller.updateService.bind(controller),
);

// --- Flujo Proveedor (Panel de control) ---
router.get(
  "/companies/:companyId/services",
  controller.getCompanyServices.bind(controller),
);

router.get(
  "/services/:id",
  controller.getServiceById.bind(controller),
);

export default router;
