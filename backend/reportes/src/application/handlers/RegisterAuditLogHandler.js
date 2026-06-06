import { auditLogStore } from "../../infrastructure/audit/auditLogStore.js";

/**
 * Encapsula la escritura de auditoría para que controllers y handlers
 * no dependan directamente del mecanismo de persistencia.
 */
export class RegisterAuditLogHandler {
  constructor(store = auditLogStore) {
    this.store = store;
  }

  async execute(command) {
    return this.store.save({
      action: command.action,
      actor_user_id: command.actorUserId,
      actor_email: command.actorEmail,
      company_id: command.companyId,
      resource_type: command.resourceType,
      resource_id: command.resourceId,
      metadata: command.metadata,
    });
  }
}