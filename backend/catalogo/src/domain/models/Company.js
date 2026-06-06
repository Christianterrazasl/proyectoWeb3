/**
 * NOTA PARA EL EQUIPO: Cualquier cambio en los atributos del negocio para las
 * empresas debe reflejarse primero aquí.
 * * Entidad de Dominio: Company
 * Representa una empresa proveedora en el sistema Multipagos QR.
 * Es una clase pura de JavaScript, totalmente agnóstica a la base de datos (Postgres/Mongo) o Express.
 */
export class Company {
  constructor(id, name, nit, status, active, createdAt, updatedAt, logoUrl) {
    this.id = id; // ID canónico emitido por auth
    this.name = name;
    this.nit = nit;
    this.status = status; // "PENDING" | "APPROVED" | "REJECTED"
    this.active = active;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.logoUrl = logoUrl;
  }

  /**
   * REGLAS DE NEGOCIO (Comportamientos)
   * En lugar de cambiar el 'status' directamente desde los controladores,
   * usamos métodos de dominio para encapsular la lógica.
   */
  isActive() {
    return this.status === "APPROVED" && this.active === true;
  }

  syncLifecycle(status, active) {
    // Catálogo no decide el lifecycle: solo refleja el contrato canónico resuelto en auth.
    this.status = status;
    this.active = active;
    this.updatedAt = new Date();
  }
}
