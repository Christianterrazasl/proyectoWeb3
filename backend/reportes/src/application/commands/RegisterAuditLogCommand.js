/**
 * Representa una acción administrativa que queremos dejar registrada.
 * No sabe cómo se persiste; solo transporta la intención de auditoría.
 */
export class RegisterAuditLogCommand {
  constructor({
    action,
    actorUserId = null,
    actorEmail = null,
    companyId = null,
    resourceType = null,
    resourceId = null,
    metadata = {},
  } = {}) {
    this.action = action;
    this.actorUserId = actorUserId;
    this.actorEmail = actorEmail;
    this.companyId = companyId;
    this.resourceType = resourceType;
    this.resourceId = resourceId;
    this.metadata = metadata;
  }
}