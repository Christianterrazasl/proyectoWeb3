import { Router } from "express";
import { CompanyController } from "../controllers/CompanyController.js";
import { CompanyRepositoryImpl } from "../../infrastructure/repositories_impl/CompanyRepositoryImpl.js";
import { CreateCompanyCommandHandler } from "../../application/commands/CreateCompanyCommand.js";
import { ServiceRepositoryImpl } from "../../infrastructure/repositories_impl/ServiceRepositoryImpl.js";
import { CreateServiceCommandHandler } from "../../application/commands/CreateServiceCommand.js";

const router = Router();

/**
 * Contenedor de Inyección de Dependencias (Wiring).
 * Aquí instanciamos las implementaciones de infraestructura, las pasamos a
 * los casos de uso (Application), y finalmente al controlador.
 */

// 1. Repositorios (Infraestructura)
const companyRepository = new CompanyRepositoryImpl();
const serviceRepository = new ServiceRepositoryImpl();

// 2. Handlers / Casos de uso (Aplicación)
const createCompanyHandler = new CreateCompanyCommandHandler(companyRepository);
const createServiceHandler = new CreateServiceCommandHandler(serviceRepository);

// 3. Controlador (Presentación)
const controller = new CompanyController(
  createCompanyHandler,
  companyRepository,
  createServiceHandler,
);

/**
 * Definición de Endpoints.
 * El ruteo se delega directamente a los métodos del CompanyController.
 */
router.post("/admin/companies", (req, res) =>
  controller.createCompany(req, res),
);
router.post("/catalog/services", (req, res) =>
  controller.createService(req, res),
);
router.get("/catalog/services", (req, res) => controller.getCatalog(req, res));

export default router;
