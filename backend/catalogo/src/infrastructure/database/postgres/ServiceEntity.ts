// src/infrastructure/database/postgres/ServiceEntity.ts
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { CompanyEntity } from "./CompanyEntity";

/**
 * Entidad de TypeORM para Servicios.
 * Garantiza a nivel de base de datos SQL que un servicio no pueda existir sin una empresa.
 */
@Entity("services")
export class ServiceEntity {
  @PrimaryColumn({ type: "varchar", length: 50 })
  id!: string;

  @Column({ type: "varchar", length: 50 })
  companyId!: string;

  @Column({ type: "varchar", length: 150 })
  name!: string;

  // Guardamos el JSON dinámico directamente en PostgreSQL usando jsonb
  @Column({ type: "jsonb" })
  inputSchema!: any;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  /**
   * Relación estricta con la empresa.
   * Previene datos huérfanos a nivel de arquitectura SQL.
   */
  @ManyToOne(() => CompanyEntity)
  @JoinColumn({ name: "companyId" })
  company!: CompanyEntity;
}
