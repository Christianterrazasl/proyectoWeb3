import {
  buildCompanyPortfolioQuery,
  buildDashboardSummaryQuery,
  buildServiceKpiQuery,
  buildTransactionMonitoringQuery,
  resolveScopedCompanyId,
} from "../shared/reportRequestBuilders.js";
import {
  safeRegisterAuditLog,
  sendControllerError,
  sendJsonSuccess,
} from "../shared/reportControllerSupport.js";

export class ReadReportController {
  constructor({
    portfolioSummaryHandler,
    serviceKpiReportHandler,
    transactionMonitoringHandler,
    dashboardSummaryHandler,
    registerAuditLogHandler,
  }) {
    this.portfolioSummaryHandler = portfolioSummaryHandler;
    this.serviceKpiReportHandler = serviceKpiReportHandler;
    this.transactionMonitoringHandler = transactionMonitoringHandler;
    this.dashboardSummaryHandler = dashboardSummaryHandler;
    this.registerAuditLogHandler = registerAuditLogHandler;
  }

  async getCompanyPortfolioSummary(req, res) {
    try {
      const result = await this.portfolioSummaryHandler.execute(
        buildCompanyPortfolioQuery(req),
      );

      await safeRegisterAuditLog({
        req,
        registerAuditLogHandler: this.registerAuditLogHandler,
        resolveScopedCompanyId,
        action: "view_company_portfolio_summary",
        resourceType: "report",
        metadata: {
          row_count: result.length,
        },
      });

      return sendJsonSuccess(res, result);
    } catch (error) {
      return sendControllerError(res, error);
    }
  }

  async getServiceKpiReport(req, res) {
    try {
      const result = await this.serviceKpiReportHandler.execute(
        buildServiceKpiQuery(req),
      );

      await safeRegisterAuditLog({
        req,
        registerAuditLogHandler: this.registerAuditLogHandler,
        resolveScopedCompanyId,
        action: "view_service_kpi_report",
        resourceType: "report",
        metadata: {
          row_count: result.length,
        },
      });

      return sendJsonSuccess(res, result);
    } catch (error) {
      return sendControllerError(res, error);
    }
  }

  async getTransactionMonitoring(req, res) {
    try {
      const result = await this.transactionMonitoringHandler.execute(
        buildTransactionMonitoringQuery(req),
      );

      await safeRegisterAuditLog({
        req,
        registerAuditLogHandler: this.registerAuditLogHandler,
        resolveScopedCompanyId,
        action: "view_transaction_monitoring",
        resourceType: "report",
        metadata: {
          tenant_id: req.query.tenant_id ?? null,
          service_id: req.query.service_id ?? null,
          status: req.query.status ?? null,
          customer_ref: req.query.customer_ref ?? null,
          from: req.query.from ?? null,
          to: req.query.to ?? null,
          row_count: result.length,
        },
      });

      return sendJsonSuccess(res, result);
    } catch (error) {
      return sendControllerError(res, error);
    }
  }

  /**
   * El dashboard global resume el estado del sistema en una sola lectura.
   * Después registramos el acceso para dejar trazabilidad administrativa.
   */
  async getDashboardSummary(req, res) {
    try {
      const result = await this.dashboardSummaryHandler.execute(
        buildDashboardSummaryQuery(req),
      );

      await safeRegisterAuditLog({
        req,
        registerAuditLogHandler: this.registerAuditLogHandler,
        resolveScopedCompanyId,
        action: "view_dashboard_summary",
        resourceType: "dashboard",
        metadata: {
          from: req.query.from ?? null,
          to: req.query.to ?? null,
          company_scope: resolveScopedCompanyId(req),
        },
      });

      return sendJsonSuccess(res, result);
    } catch (error) {
      return sendControllerError(res, error);
    }
  }
}
