// src/domain/repositories/ICompanyRepository.ts
import { Company } from "../models/Company";

/**
 * Contrato del Repositorio de Empresas.
 * NOTA PARA EL EQUIPO: Aplicamos el Principio de Inversión de Dependencias (SOLID).
 * Los Casos de Uso (Commands/Queries) usarán esta interfaz, no la implementación real.
 */
export interface ICompanyRepository {
  // === Operaciones de Escritura (Commands) ===
  save(company: Company): Promise<void>;
  update(company: Company): Promise<void>;

  // === Operaciones de Lectura (Queries) ===
  findById(id: string): Promise<Company | null>;
  findByNit(nit: string): Promise<Company | null>;
  findAll(): Promise<Company[]>;
}
