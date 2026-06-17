import { buildCsvBuffer, buildXlsxBuffer } from "../../../infrastructure/export/tabularExport.js";
import {
  buildCompanyPortfolioQuery,
  buildServiceKpiQuery,
  buildTransactionMonitoringQuery,
  resolveScopedCompanyId,
} from "../shared/reportRequestBuilders.js";
import {
  COMPANY_EXPORT_COLUMNS,
  CSV_CONTENT_TYPE,
  SERVICE_EXPORT_COLUMNS,
  TRANSACTION_EXPORT_COLUMNS,
  XLSX_CONTENT_TYPE,
  safeRegisterAuditLog,
  sendControllerError,
  sendDownload,
} from "../shared/reportControllerSupport.js";

export class ExportReportController {
  constructor({
    portfolioSummaryHandler,
    serviceKpiReportHandler,
    transactionMonitoringHandler,
    registerAuditLogHandler,
  }) {
    this.portfolioSummaryHandler = portfolioSummaryHandler;
    this.serviceKpiReportHandler = serviceKpiReportHandler;
    this.transactionMonitoringHandler = transactionMonitoringHandler;
    this.registerAuditLogHandler = registerAuditLogHandler;
  }

  async exportCompaniesCsv(req, res) {
    try {
      const rows = await this.portfolioSummaryHandler.execute(
        buildCompanyPortfolioQuery(req),
      );
      const buffer = buildCsvBuffer(rows, COMPANY_EXPORT_COLUMNS);

      await safeRegisterAuditLog({
        req,
        registerAuditLogHandler: this.registerAuditLogHandler,
        resolveScopedCompanyId,
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
      return sendControllerError(res, error);
    }
  }

  async exportCompaniesXlsx(req, res) {
    try {
      const rows = await this.portfolioSummaryHandler.execute(
        buildCompanyPortfolioQuery(req),
      );
      const buffer = buildXlsxBuffer(rows, COMPANY_EXPORT_COLUMNS, "Companies");

      await safeRegisterAuditLog({
        req,
        registerAuditLogHandler: this.registerAuditLogHandler,
        resolveScopedCompanyId,
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
      return sendControllerError(res, error);
    }
  }

  async exportServicesCsv(req, res) {
    try {
      const rows = await this.serviceKpiReportHandler.execute(
        buildServiceKpiQuery(req),
      );
      const buffer = buildCsvBuffer(rows, SERVICE_EXPORT_COLUMNS);

      await safeRegisterAuditLog({
        req,
        registerAuditLogHandler: this.registerAuditLogHandler,
        resolveScopedCompanyId,
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
      return sendControllerError(res, error);
    }
  }

  async exportServicesXlsx(req, res) {
    try {
      const rows = await this.serviceKpiReportHandler.execute(
        buildServiceKpiQuery(req),
      );
      const buffer = buildXlsxBuffer(rows, SERVICE_EXPORT_COLUMNS, "Services");

      await safeRegisterAuditLog({
        req,
        registerAuditLogHandler: this.registerAuditLogHandler,
        resolveScopedCompanyId,
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
      return sendControllerError(res, error);
    }
  }

  async exportTransactionsCsv(req, res) {
    try {
      const rows = await this.transactionMonitoringHandler.execute(
        buildTransactionMonitoringQuery(req),
      );
      const buffer = buildCsvBuffer(rows, TRANSACTION_EXPORT_COLUMNS);

      await safeRegisterAuditLog({
        req,
        registerAuditLogHandler: this.registerAuditLogHandler,
        resolveScopedCompanyId,
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
      return sendControllerError(res, error);
    }
  }

  async exportTransactionsXlsx(req, res) {
    try {
      const rows = await this.transactionMonitoringHandler.execute(
        buildTransactionMonitoringQuery(req),
      );
      const buffer = buildXlsxBuffer(
        rows,
        TRANSACTION_EXPORT_COLUMNS,
        "Transactions",
      );

      await safeRegisterAuditLog({
        req,
        registerAuditLogHandler: this.registerAuditLogHandler,
        resolveScopedCompanyId,
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
      return sendControllerError(res, error);
    }
  }
}
