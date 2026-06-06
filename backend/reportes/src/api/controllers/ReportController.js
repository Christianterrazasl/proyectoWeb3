import { GetCompanyPortfolioSummaryQuery } from "../../application/queries/GetCompanyPortfolioSummaryQuery.js";
import { GetCompanyPortfolioSummaryHandler } from "../../application/handlers/GetCompanyPortfolioSummaryHandler.js";
import { GetServiceKpiReportQuery } from "../../application/queries/GetServiceKpiReportQuery.js";
import { GetServiceKpiReportHandler } from "../../application/handlers/GetServiceKpiReportHandler.js";
import { GetTransactionMonitoringQuery } from "../../application/queries/GetTransactionMonitoringQuery.js";
import { GetTransactionMonitoringHandler } from "../../application/handlers/GetTransactionMonitoringHandler.js";
import { GetDashboardSummaryQuery } from "../../application/queries/GetDashboardSummaryQuery.js";
import { GetDashboardSummaryHandler } from "../../application/handlers/GetDashboardSummaryHandler.js";
import { RegisterAuditLogCommand } from "../../application/commands/RegisterAuditLogCommand.js";
import { RegisterAuditLogHandler } from "../../application/handlers/RegisterAuditLogHandler.js";
import { GetAuditLogsQuery } from "../../application/queries/GetAuditLogsQuery.js";
import { GetAuditLogsHandler } from "../../application/handlers/GetAuditLogsHandler.js";
import {
  buildCsvBuffer,
  buildXlsxBuffer,
} from "../../infrastructure/export/tabularExport.js";

const CSV_CONTENT_TYPE = "text/csv; charset=utf-8";
const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const COMPANY_EXPORT_COLUMNS = [
  { key: "company_id", header: "Company ID" },
  { key: "company_name", header: "Empresa" },
  { key: "company_status", header: "Estado empresa" },
  { key: "company_active", header: "Empresa activa" },
  { key: "total_debts", header: "Total deudas" },
  { key: "pending_debts", header: "Deudas pendientes" },
  { key: "paid_debts", header: "Deudas pagadas" },
  { key: "cancelled_debts", header: "Deudas canceladas" },
  { key: "pending_amount", header: "Monto pendiente" },
];

const SERVICE_EXPORT_COLUMNS = [
  { key: "service_id", header: "Service ID" },
  { key: "service_name", header: "Servicio" },
  { key: "company_id", header: "Company ID" },
  { key: "company_name", header: "Empresa" },
  { key: "is_published", header: "Publicado" },
  { key: "total_debts", header: "Total deudas" },
  { key: "pending_debts", header: "Deudas pendientes" },
  { key: "paid_debts", header: "Deudas pagadas" },
  { key: "cancelled_debts", header: "Deudas canceladas" },
  { key: "pending_amount", header: "Monto pendiente" },
];

const TRANSACTION_EXPORT_COLUMNS = [
  { key: "transaction_id", header: "Transaction ID" },
  { key: "created_at", header: "Fecha creación" },
  { key: "status", header: "Estado" },
  { key: "amount", header: "Monto" },
  { key: "company_id", header: "Company ID" },
  { key: "company_name", header: "Empresa" },
  { key: "service_id", header: "Service ID" },
  { key: "service_name", header: "Servicio" },
  { key: "customer_ref", header: "Referencia cliente" },
  { key: "receipt_hash", header: "Comprobante" },
];

function resolveErrorStatus(error) {
  return Number.isInteger(error?.status) ? error.status : 500;
}

/**
 * Si el admin manda X-Company-Id, usamos el scope ya validado por auth.
 * Si no lo manda, la lectura/exportación será global.
 */
function resolveScopedCompanyId(req) {
  return req.header("x-company-id") ? req.companyId : null;
}

function sendDownload(res, { buffer, filename, contentType }) {
  return res
    .status(200)
    .setHeader("Content-Type", contentType)
    .setHeader("Content-Disposition", `attachment; filename="${filename}"`)
    .send(buffer);
}

export class ReportController {
  constructor(
    portfolioSummaryHandler = new GetCompanyPortfolioSummaryHandler(),
    serviceKpiReportHandler = new GetServiceKpiReportHandler(),
    transactionMonitoringHandler = new GetTransactionMonitoringHandler(),
    dashboardSummaryHandler = new GetDashboardSummaryHandler(),
    registerAuditLogHandler = new RegisterAuditLogHandler(),
    getAuditLogsHandler = new GetAuditLogsHandler(),
  ) {
    this.portfolioSummaryHandler = portfolioSummaryHandler;
    this.serviceKpiReportHandler = serviceKpiReportHandler;
    this.transactionMonitoringHandler = transactionMonitoringHandler;
    this.dashboardSummaryHandler = dashboardSummaryHandler;
    this.registerAuditLogHandler = registerAuditLogHandler;
    this.getAuditLogsHandler = getAuditLogsHandler;
  }

  /**
   * Estas funciones construyen queries de slices ya existentes.
   * Las reutilizamos para JSON y exportaciones, así evitamos duplicar lógica.
   */
  buildCompanyPortfolioQuery(req) {
    return new GetCompanyPortfolioSummaryQuery({
      authorization: req.header("authorization"),
      companyId: resolveScopedCompanyId(req),
    });
  }

  buildServiceKpiQuery(req) {
    return new GetServiceKpiReportQuery({
      authorization: req.header("authorization"),
      companyId: resolveScopedCompanyId(req),
    });
  }

  buildTransactionMonitoringQuery(req) {
    return new GetTransactionMonitoringQuery({
      authorization: req.header("authorization"),
      companyId: resolveScopedCompanyId(req),
      tenantId: req.query.tenant_id,
      serviceId: req.query.service_id,
      status: req.query.status,
      customerRef: req.query.customer_ref,
      from: req.query.from,
      to: req.query.to,
    });
  }

  /**
   * La auditoría de este slice es "best effort":
   * si fallara el guardado del log, NO rompemos la consulta o descarga principal.
   * Para este proyecto académico preferimos mantener disponible la lectura admin.
   */
  async safeRegisterAuditLog({
    req,
    action,
    resourceType,
    resourceId = null,
    metadata = {},
  }) {
    try {
      await this.registerAuditLogHandler.execute(
        new RegisterAuditLogCommand({
          action,
          actorUserId: req.authContext?.user?.id ?? null,
          actorEmail: req.authContext?.user?.email ?? null,
          companyId: resolveScopedCompanyId(req),
          resourceType,
          resourceId,
          metadata,
        }),
      );
    } catch (error) {
      console.error("[reportes][audit] No se pudo guardar audit log:", error);
    }
  }

  async getCompanyPortfolioSummary(req, res) {
    try {
      const query = this.buildCompanyPortfolioQuery(req);
      const result = await this.portfolioSummaryHandler.execute(query);

      await this.safeRegisterAuditLog({
        req,
        action: "view_company_portfolio_summary",
        resourceType: "report",
        metadata: {
          row_count: result.length,
        },
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return res.status(resolveErrorStatus(error)).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getServiceKpiReport(req, res) {
    try {
      const query = this.buildServiceKpiQuery(req);
      const result = await this.serviceKpiReportHandler.execute(query);

      await this.safeRegisterAuditLog({
        req,
        action: "view_service_kpi_report",
        resourceType: "report",
        metadata: {
          row_count: result.length,
        },
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return res.status(resolveErrorStatus(error)).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getTransactionMonitoring(req, res) {
    try {
      const query = this.buildTransactionMonitoringQuery(req);
      const result = await this.transactionMonitoringHandler.execute(query);

      await this.safeRegisterAuditLog({
        req,
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

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return res.status(resolveErrorStatus(error)).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * El dashboard global resume el estado del sistema en una sola lectura.
   * Después registramos el acceso para dejar trazabilidad administrativa.
   */
  async getDashboardSummary(req, res) {
    try {
      const query = new GetDashboardSummaryQuery({
        authorization: req.header("authorization"),
        companyId: resolveScopedCompanyId(req),
        from: req.query.from,
        to: req.query.to,
      });

      const result = await this.dashboardSummaryHandler.execute(query);

      await this.safeRegisterAuditLog({
        req,
        action: "view_dashboard_summary",
        resourceType: "dashboard",
        metadata: {
          from: req.query.from ?? null,
          to: req.query.to ?? null,
          company_scope: resolveScopedCompanyId(req),
        },
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return res.status(resolveErrorStatus(error)).json({
        success: false,
        message: error.message,
      });
    }
  }

  async exportCompaniesCsv(req, res) {
    try {
      const query = this.buildCompanyPortfolioQuery(req);
      const rows = await this.portfolioSummaryHandler.execute(query);
      const buffer = buildCsvBuffer(rows, COMPANY_EXPORT_COLUMNS);

      await this.safeRegisterAuditLog({
        req,
        action: "export_companies_csv",
        resourceType: "export",
        metadata: {
          format: "csv",
          row_count: rows.length,
        },
      });

      return sendDownload(res, {
        buffer,
        filename: "companies-report.csv",
        contentType: CSV_CONTENT_TYPE,
      });
    } catch (error) {
      return res.status(resolveErrorStatus(error)).json({
        success: false,
        message: error.message,
      });
    }
  }

  async exportCompaniesXlsx(req, res) {
    try {
      const query = this.buildCompanyPortfolioQuery(req);
      const rows = await this.portfolioSummaryHandler.execute(query);
      const buffer = buildXlsxBuffer(rows, COMPANY_EXPORT_COLUMNS, "Companies");

      await this.safeRegisterAuditLog({
        req,
        action: "export_companies_xlsx",
        resourceType: "export",
        metadata: {
          format: "xlsx",
          row_count: rows.length,
        },
      });

      return sendDownload(res, {
        buffer,
        filename: "companies-report.xlsx",
        contentType: XLSX_CONTENT_TYPE,
      });
    } catch (error) {
      return res.status(resolveErrorStatus(error)).json({
        success: false,
        message: error.message,
      });
    }
  }

  async exportServicesCsv(req, res) {
    try {
      const query = this.buildServiceKpiQuery(req);
      const rows = await this.serviceKpiReportHandler.execute(query);
      const buffer = buildCsvBuffer(rows, SERVICE_EXPORT_COLUMNS);

      await this.safeRegisterAuditLog({
        req,
        action: "export_services_csv",
        resourceType: "export",
        metadata: {
          format: "csv",
          row_count: rows.length,
        },
      });

      return sendDownload(res, {
        buffer,
        filename: "services-kpi-report.csv",
        contentType: CSV_CONTENT_TYPE,
      });
    } catch (error) {
      return res.status(resolveErrorStatus(error)).json({
        success: false,
        message: error.message,
      });
    }
  }

  async exportServicesXlsx(req, res) {
    try {
      const query = this.buildServiceKpiQuery(req);
      const rows = await this.serviceKpiReportHandler.execute(query);
      const buffer = buildXlsxBuffer(rows, SERVICE_EXPORT_COLUMNS, "Services");

      await this.safeRegisterAuditLog({
        req,
        action: "export_services_xlsx",
        resourceType: "export",
        metadata: {
          format: "xlsx",
          row_count: rows.length,
        },
      });

      return sendDownload(res, {
        buffer,
        filename: "services-kpi-report.xlsx",
        contentType: XLSX_CONTENT_TYPE,
      });
    } catch (error) {
      return res.status(resolveErrorStatus(error)).json({
        success: false,
        message: error.message,
      });
    }
  }

  async exportTransactionsCsv(req, res) {
    try {
      const query = this.buildTransactionMonitoringQuery(req);
      const rows = await this.transactionMonitoringHandler.execute(query);
      const buffer = buildCsvBuffer(rows, TRANSACTION_EXPORT_COLUMNS);

      await this.safeRegisterAuditLog({
        req,
        action: "export_transactions_csv",
        resourceType: "export",
        metadata: {
          format: "csv",
          tenant_id: req.query.tenant_id ?? null,
          service_id: req.query.service_id ?? null,
          status: req.query.status ?? null,
          customer_ref: req.query.customer_ref ?? null,
          from: req.query.from ?? null,
          to: req.query.to ?? null,
          row_count: rows.length,
        },
      });

      return sendDownload(res, {
        buffer,
        filename: "transactions-monitoring.csv",
        contentType: CSV_CONTENT_TYPE,
      });
    } catch (error) {
      return res.status(resolveErrorStatus(error)).json({
        success: false,
        message: error.message,
      });
    }
  }

  async exportTransactionsXlsx(req, res) {
    try {
      const query = this.buildTransactionMonitoringQuery(req);
      const rows = await this.transactionMonitoringHandler.execute(query);
      const buffer = buildXlsxBuffer(
        rows,
        TRANSACTION_EXPORT_COLUMNS,
        "Transactions",
      );

      await this.safeRegisterAuditLog({
        req,
        action: "export_transactions_xlsx",
        resourceType: "export",
        metadata: {
          format: "xlsx",
          tenant_id: req.query.tenant_id ?? null,
          service_id: req.query.service_id ?? null,
          status: req.query.status ?? null,
          customer_ref: req.query.customer_ref ?? null,
          from: req.query.from ?? null,
          to: req.query.to ?? null,
          row_count: rows.length,
        },
      });

      return sendDownload(res, {
        buffer,
        filename: "transactions-monitoring.xlsx",
        contentType: XLSX_CONTENT_TYPE,
      });
    } catch (error) {
      return res.status(resolveErrorStatus(error)).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Slice 6: consulta de bitácora.
   * Aquí el admin puede revisar qué reportes o exportaciones se consumieron y por quién.
   */
  async getAuditLogs(req, res) {
    try {
      const scopedCompanyId = resolveScopedCompanyId(req);
      const requestedCompanyId = scopedCompanyId ?? req.query.company_id ?? null;

      const query = new GetAuditLogsQuery({
        action: req.query.action,
        companyId: requestedCompanyId,
        actorUserId: req.query.actor_user_id,
        resourceType: req.query.resource_type,
        from: req.query.from,
        to: req.query.to,
      });

      const result = await this.getAuditLogsHandler.execute(query);

      await this.safeRegisterAuditLog({
        req,
        action: "view_audit_logs",
        resourceType: "audit_log",
        metadata: {
          action_filter: req.query.action ?? null,
          company_filter: requestedCompanyId,
          actor_user_id: req.query.actor_user_id ?? null,
          resource_type: req.query.resource_type ?? null,
          from: req.query.from ?? null,
          to: req.query.to ?? null,
          row_count: result.length,
        },
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return res.status(resolveErrorStatus(error)).json({
        success: false,
        message: error.message,
      });
    }
  }
}