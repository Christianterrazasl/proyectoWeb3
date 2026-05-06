// src/domain/models/Company.ts

/**
 * Interfaz que define el contrato de la Entidad Company.
 * NOTA PARA EL EQUIPO: Cualquier cambio en los atributos del negocio para las
 * empresas debe reflejarse primero aquí.
 */
export interface ICompany {
  id: string; // Formato esperado: cmp-001
  name: string;
  nit: string;
  logoUrl?: string;
  status: "PENDING" | "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Entidad de Dominio: Company
 * Representa una empresa proveedora en el sistema Multipagos QR.
 * Es una clase pura de TypeScript, totalmente agnóstica a la base de datos (Postgres/Mongo) o Express.
 */
export class Company implements ICompany {
  constructor(
    public id: string,
    public name: string,
    public nit: string,
    public status: "PENDING" | "ACTIVE" | "INACTIVE",
    public createdAt: Date,
    public updatedAt: Date,
    public logoUrl?: string,
  ) {}

  /**
   * REGLAS DE NEGOCIO (Comportamientos)
   * En lugar de cambiar el 'status' directamente desde los controladores,
   * usamos métodos de dominio para encapsular la lógica.
   */

  isActive(): boolean {
    return this.status === "ACTIVE";
  }

  activate(): void {
    // Al activar, siempre actualizamos la fecha de modificación
    this.status = "ACTIVE";
    this.updatedAt = new Date();
  }
}
