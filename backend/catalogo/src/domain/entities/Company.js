/**
 * Entidad de dominio: Company.
 */
export class Company {
  constructor(id, name, nit, status, active, createdAt, updatedAt, logoUrl) {
    this.id = id;
    this.name = name;
    this.nit = nit;
    this.status = status;
    this.active = active;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.logoUrl = logoUrl;
  }

  isActive() {
    return this.status === "APPROVED" && this.active === true;
  }

  syncLifecycle(status, active) {
    this.status = status;
    this.active = active;
    this.updatedAt = new Date();
  }
}
