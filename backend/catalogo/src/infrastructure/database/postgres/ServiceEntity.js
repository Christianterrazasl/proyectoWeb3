import { EntitySchema } from "typeorm";

/**
 * Entidad de TypeORM para Servicios.
 * Garantiza a nivel de base de datos SQL que un servicio no pueda existir sin una empresa.
 */
export const ServiceEntity = new EntitySchema({
  name: "Service",
  tableName: "services",
  columns: {
    id: { type: "varchar", length: 50, primary: true },
    companyId: { type: "int" },
    name: { type: "varchar", length: 150 },
    // Guardamos el JSON dinámico directamente en PostgreSQL usando jsonb
    inputSchema: { type: "jsonb" },
    isPublished: { type: "boolean", default: true },
  },
  relations: {
    /**
     * Relación estricta con la empresa.
     * Previene datos huérfanos a nivel de arquitectura SQL.
     */
    company: {
      target: "Company",
      type: "many-to-one",
      joinColumn: { name: "companyId" },
    },
  },
});
