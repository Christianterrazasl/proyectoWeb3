import { EntitySchema } from "typeorm";

/**
 * Entidad de TypeORM (Capa de Escritura / CQRS Command)
 * Representa la tabla relacional en PostgreSQL. Esta es la "Fuente de la Verdad Absoluta"
 * del sistema, garantizando integridad referencial y bloqueos transaccionales.
 */
export const CompanyEntity = new EntitySchema({
  name: "Company",
  tableName: "companies",
  columns: {
    id: { type: "int", primary: true },
    name: { type: "varchar", length: 150 },
    nit: { type: "varchar", length: 50, unique: true },
    status: { type: "varchar", length: 20, default: "PENDING" },
    active: { type: "boolean", default: true },
    logoUrl: { type: "varchar", length: 255, nullable: true },
    createdAt: { type: "timestamp", createDate: true },
    updatedAt: { type: "timestamp", updateDate: true },
  },
});
