// src/domain/repositories/IServiceRepository.ts
import { Service } from "../models/Service";

/**
 * Contrato del Repositorio de Servicios.
 */
export interface IServiceRepository {
  save(service: Service): Promise<void>;
  findByCompanyId(companyId: string): Promise<Service[]>;
}
