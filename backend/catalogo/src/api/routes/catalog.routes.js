import { Router } from "express";
import { CompanyController } from "../controllers/CompanyController.js";
import { CompanyRepositoryImpl } from "../../infrastructure/repositories_impl/CompanyRepositoryImpl.js";
import { ServiceRepositoryImpl } from "../../infrastructure/repositories_impl/ServiceRepositoryImpl.js";
import { CreateServiceCommandHandler } from "../../application/commands/CreateServiceCommand.js";
import { requireAdminSession } from "../middleware/requireAdminSession.js";

const router = Router();

/**
 * Wiring simple del módulo catálogo.
 */
const companyRepository = new CompanyRepositoryImpl();
const serviceRepository = new ServiceRepositoryImpl();
const createServiceHandler = new CreateServiceCommandHandler(serviceRepository);

const controller = new CompanyController(
  companyRepository,
  serviceRepository,
  createServiceHandler,
);

// Escritura admin protegida
router.post("/admin/services", requireAdminSession, (req, res) =>
  controller.createService(req, res),
);

// Lectura admin protegida para reportes/panel
router.get("/admin/services", requireAdminSession, (req, res) =>
  controller.getAdminServices(req, res),
);

// Catálogo público
router.get("/catalog/services", (req, res) => controller.getCatalog(req, res));

// --- Edición ---
router.put(
  "/companies/:id",
  companyController.updateCompany.bind(companyController),
);
router.put(
  "/services/:id",
  companyController.updateService.bind(companyController),
);

// --- Flujo Proveedor (Panel de control) ---
router.get(
  "/companies/:companyId/services",
  companyController.getCompanyServices.bind(companyController),
);

router.get(
  "/services/:id",
  companyController.getServiceById.bind(companyController),
);

export default router;
