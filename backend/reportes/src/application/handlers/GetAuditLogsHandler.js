import { auditLogStore } from "../../infrastructure/audit/auditLogStore.js";

/**
 * Lee la bitácora del módulo reportes y aplica filtros administrativos básicos.
 * La idea es que el panel pueda revisar quién consultó o exportó información.
 */
export class GetAuditLogsHandler {
  constructor(store = auditLogStore) {
    this.store = store;
  }

  async execute(query) {
    return this.store.list({
      action: query.action,
      company_id: query.companyId,
      actor_user_id: query.actorUserId,
      resource_type: query.resourceType,
      from: query.from,
      to: query.to,
    });
  }
}