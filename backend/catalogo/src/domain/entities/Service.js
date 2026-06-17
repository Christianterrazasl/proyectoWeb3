/**
 * Entidad de dominio: Service.
 */
export class Service {
  constructor(id, companyId, name, inputSchema, isPublished = true) {
    this.id = id;
    this.companyId = companyId;
    this.name = name;
    this.inputSchema = inputSchema;
    this.isPublished = isPublished;
  }
}
