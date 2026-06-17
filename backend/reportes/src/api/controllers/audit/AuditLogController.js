import {
  buildAuditLogsQuery,
  resolveScopedCompanyId,
} from "../shared/reportRequestBuilders.js";
import {
  safeRegisterAuditLog,
  sendControllerError,
  sendJsonSuccess,
} from "../shared/reportControllerSupport.js";

export class AuditLogController {
  constructor({ getAuditLogsHandler, registerAuditLogHandler }) {
    this.getAuditLogsHandler = getAuditLogsHandler;
    this.registerAuditLogHandler = registerAuditLogHandler;
  }

  /**
   * Slice 6: consulta de bitácora.
   * Aquí el admin puede revisar qué reportes o exportaciones se consumieron y por quién.
   */
  async getAuditLogs(req, res) {
    try {
      const requestedCompanyId =
        resolveScopedCompanyId(req) ?? req.query.company_id ?? null;
      const result = await this.getAuditLogsHandler.execute(buildAuditLogsQuery(req));

      await safeRegisterAuditLog({
        req,
        registerAuditLogHandler: this.registerAuditLogHandler,
        resolveScopedCompanyId,
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

      return sendJsonSuccess(res, result);
    } catch (error) {
      return sendControllerError(res, error);
    }
  }
}
