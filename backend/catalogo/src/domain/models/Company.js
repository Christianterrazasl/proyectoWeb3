/**
 * NOTA PARA EL EQUIPO: Cualquier cambio en los atributos del negocio para las
 * empresas debe reflejarse primero aquí.
 * * Entidad de Dominio: Company
 * Representa una empresa proveedora en el sistema Multipagos QR.
 * Es una clase pura de JavaScript, totalmente agnóstica a la base de datos (Postgres/Mongo) o Express.
 */
export class Company {
  constructor(id, name, nit, status, createdAt, updatedAt, logoUrl) {
    this.id = id; // Formato esperado: cmp-001
    this.name = name;
    this.nit = nit;
    this.status = status; // "PENDING" | "ACTIVE" | "INACTIVE"
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
    return this.status === "ACTIVE";
  }

  activate() {
    // Al activar, siempre actualizamos la fecha de modificación
    this.status = "ACTIVE";
    this.updatedAt = new Date();
  }
}
