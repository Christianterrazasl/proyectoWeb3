import { Router } from "express";
import { CompanyController } from "../controllers/CompanyController.js";
import { CompanyRepositoryImpl } from "../../infrastructure/repositories_impl/CompanyRepositoryImpl.js";
import { ServiceRepositoryImpl } from "../../infrastructure/repositories_impl/ServiceRepositoryImpl.js";
import { requireAdminSession } from "../middleware/requireAdminSession.js";
import { requireCompanySession } from "../middleware/requireCompanySession.js";

const router = Router();
const companyRepo = new CompanyRepositoryImpl();
const serviceRepo = new ServiceRepositoryImpl();
const controller = new CompanyController(companyRepo, serviceRepo);

router.get("/public/services", (req, res) =>
  controller.getPublicCatalog(req, res),
);

router.get("/public/companies/:companyId/services", (req, res) =>
  controller.getCompanyServices(req, res),
);

router.get("/company/services", requireCompanySession, (req, res) =>
  controller.getCompanyServices(req, res),
);

router.use(requireAdminSession);

router.post("/companies", (req, res) => controller.createCompany(req, res));
router.put("/companies/:id", (req, res) => controller.updateCompany(req, res));

router.post("/services", (req, res) => controller.createService(req, res));
router.put("/services/:id", (req, res) => controller.updateService(req, res));
router.get("/companies/:companyId/services", (req, res) =>
  controller.getCompanyServices(req, res),
);
router.get("/services", (req, res) => controller.listAdminServices(req, res));

export default router;
