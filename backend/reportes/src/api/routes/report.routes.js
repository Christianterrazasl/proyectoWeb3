import { Router } from "express";
import { requireAdminSession } from "../middleware/requireAdminSession.js";
import { ReportController } from "../controllers/ReportController.js";

export function createReportRouter({
  controller = new ReportController(),
  requireAdminSessionMiddleware = requireAdminSession,
} = {}) {
  const router = Router();

  router.get(
    "/admin/reports/companies/portfolio-summary",
    requireAdminSessionMiddleware,
    (req, res) => controller.getCompanyPortfolioSummary(req, res),
  );

  router.get(
    "/admin/reports/services/kpis",
    requireAdminSessionMiddleware,
    (req, res) => controller.getServiceKpiReport(req, res),
  );

  router.get(
    "/admin/reports/transactions/monitoring",
    requireAdminSessionMiddleware,
    (req, res) => controller.getTransactionMonitoring(req, res),
  );

  // Este endpoint alimenta las tarjetas del dashboard global admin.
  router.get(
    "/admin/dashboard/summary",
    requireAdminSessionMiddleware,
    (req, res) => controller.getDashboardSummary(req, res),
  );

  /**
   * Slice 5: exportaciones reutilizando handlers ya construidos.
   * La diferencia está en el formato de salida, no en la lógica del reporte.
   */
  router.get(
    "/admin/exports/companies.csv",
    requireAdminSessionMiddleware,
    (req, res) => controller.exportCompaniesCsv(req, res),
  );

  router.get(
    "/admin/exports/companies.xlsx",
    requireAdminSessionMiddleware,
    (req, res) => controller.exportCompaniesXlsx(req, res),
  );

  router.get(
    "/admin/exports/services.csv",
    requireAdminSessionMiddleware,
    (req, res) => controller.exportServicesCsv(req, res),
  );

  router.get(
    "/admin/exports/services.xlsx",
    requireAdminSessionMiddleware,
    (req, res) => controller.exportServicesXlsx(req, res),
  );

  router.get(
    "/admin/exports/transactions.csv",
    requireAdminSessionMiddleware,
    (req, res) => controller.exportTransactionsCsv(req, res),
  );

  router.get(
    "/admin/exports/transactions.xlsx",
    requireAdminSessionMiddleware,
    (req, res) => controller.exportTransactionsXlsx(req, res),
  );

  /**
   * Slice 6: bitácora administrativa.
   * Este endpoint deja que el admin revise accesos y descargas dentro del módulo.
   */
  router.get(
    "/admin/audit-logs",
    requireAdminSessionMiddleware,
    (req, res) => controller.getAuditLogs(req, res),
  );

  return router;
}

export default createReportRouter();