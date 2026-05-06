// src/infrastructure/database/postgres/CompanyEntity.ts
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

/**
 * Entidad de TypeORM (Capa de Escritura / CQRS Command)
 * Representa la tabla relacional en PostgreSQL. Esta es la "Fuente de la Verdad Absoluta"
 * del sistema, garantizando integridad referencial y bloqueos transaccionales.
 */
@Entity("companies")
export class CompanyEntity {
  @PrimaryColumn({ type: "varchar", length: 50 })
  id!: string;

  @Column({ type: "varchar", length: 150 })
  name!: string;

  @Column({ type: "varchar", length: 50, unique: true })
  nit!: string;

  @Column({ type: "varchar", length: 20, default: "ACTIVE" })
  status!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  logoUrl?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
