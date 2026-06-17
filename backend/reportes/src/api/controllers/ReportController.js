import { GetCompanyPortfolioSummaryHandler } from "../../application/handlers/GetCompanyPortfolioSummaryHandler.js";
import { GetServiceKpiReportHandler } from "../../application/handlers/GetServiceKpiReportHandler.js";
import { GetTransactionMonitoringHandler } from "../../application/handlers/GetTransactionMonitoringHandler.js";
import { GetDashboardSummaryHandler } from "../../application/handlers/GetDashboardSummaryHandler.js";
import { RegisterAuditLogHandler } from "../../application/handlers/RegisterAuditLogHandler.js";
import { GetAuditLogsHandler } from "../../application/handlers/GetAuditLogsHandler.js";
import {
  buildCompanyPortfolioQuery,
  resolveScopedCompanyId,
  buildServiceKpiQuery,
  buildTransactionMonitoringQuery,
} from "./shared/reportRequestBuilders.js";
import { safeRegisterAuditLog } from "./shared/reportControllerSupport.js";
import { ReadReportController } from "./reports/ReadReportController.js";
import { ExportReportController } from "./exports/ExportReportController.js";
import { AuditLogController } from "./audit/AuditLogController.js";

export class ReportController {
  constructor(
    portfolioSummaryHandler = new GetCompanyPortfolioSummaryHandler(),
    serviceKpiReportHandler = new GetServiceKpiReportHandler(),
    transactionMonitoringHandler = new GetTransactionMonitoringHandler(),
    dashboardSummaryHandler = new GetDashboardSummaryHandler(),
    registerAuditLogHandler = new RegisterAuditLogHandler(),
    getAuditLogsHandler = new GetAuditLogsHandler(),
  ) {
    const sharedDependencies = {
      portfolioSummaryHandler,
      serviceKpiReportHandler,
      transactionMonitoringHandler,
      dashboardSummaryHandler,
      registerAuditLogHandler,
      getAuditLogsHandler,
    };

    this.readController = new ReadReportController(sharedDependencies);
    this.exportController = new ExportReportController(sharedDependencies);
    this.auditLogController = new AuditLogController(sharedDependencies);
    this.registerAuditLogHandler = registerAuditLogHandler;
  }

  /**
   * Estas funciones construyen queries de slices ya existentes.
   * Las reutilizamos para JSON y exportaciones, así evitamos duplicar lógica.
   */
  buildCompanyPortfolioQuery(req) {
    return buildCompanyPortfolioQuery(req);
  }

  buildServiceKpiQuery(req) {
    return buildServiceKpiQuery(req);
  }

  buildTransactionMonitoringQuery(req) {
    return buildTransactionMonitoringQuery(req);
  }

  async safeRegisterAuditLog(payload) {
    return safeRegisterAuditLog({
      ...payload,
      registerAuditLogHandler: this.registerAuditLogHandler,
      resolveScopedCompanyId,
    });
  }

  async getCompanyPortfolioSummary(req, res) {
    return this.readController.getCompanyPortfolioSummary(req, res);
  }

  async getServiceKpiReport(req, res) {
    return this.readController.getServiceKpiReport(req, res);
  }

  async getTransactionMonitoring(req, res) {
    return this.readController.getTransactionMonitoring(req, res);
  }

  async getDashboardSummary(req, res) {
    return this.readController.getDashboardSummary(req, res);
  }

  async exportCompaniesCsv(req, res) {
    return this.exportController.exportCompaniesCsv(req, res);
  }

  async exportCompaniesXlsx(req, res) {
    return this.exportController.exportCompaniesXlsx(req, res);
  }

  async exportServicesCsv(req, res) {
    return this.exportController.exportServicesCsv(req, res);
  }

  async exportServicesXlsx(req, res) {
    return this.exportController.exportServicesXlsx(req, res);
  }

  async exportTransactionsCsv(req, res) {
    return this.exportController.exportTransactionsCsv(req, res);
  }

  async exportTransactionsXlsx(req, res) {
    return this.exportController.exportTransactionsXlsx(req, res);
  }

  async getAuditLogs(req, res) {
    return this.auditLogController.getAuditLogs(req, res);
  }
}
