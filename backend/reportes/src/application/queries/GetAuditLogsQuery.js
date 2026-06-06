/**
 * Representa la consulta de bitácora.
 * Guardamos filtros simples para que el admin pueda revisar actividad relevante.
 */
export class GetAuditLogsQuery {
  constructor({
    action = null,
    companyId = null,
    actorUserId = null,
    resourceType = null,
    from = null,
    to = null,
  } = {}) {
    this.action = action ?? null;
    this.companyId = companyId ?? null;
    this.actorUserId = actorUserId ?? null;
    this.resourceType = resourceType ?? null;
    this.from = from ?? null;
    this.to = to ?? null;
  }
}