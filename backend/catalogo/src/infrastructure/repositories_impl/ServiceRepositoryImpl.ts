// src/infrastructure/repositories_impl/ServiceRepositoryImpl.ts
import { IServiceRepository } from "../../domain/repositories/IServiceRepository";
import { Service } from "../../domain/models/Service";
import { AppDataSource } from "../database/connection";
import { ServiceEntity } from "../database/postgres/ServiceEntity";
import { CompanyEntity } from "../database/postgres/CompanyEntity";
import { CatalogServiceModel } from "../database/mongodb/CatalogServiceSchema";

/**
 * Implementación concreta del Repositorio de Servicios.
 */
export class ServiceRepositoryImpl implements IServiceRepository {
  private pgServiceRepo = AppDataSource.getRepository(ServiceEntity);
  private pgCompanyRepo = AppDataSource.getRepository(CompanyEntity);

  async save(service: Service): Promise<void> {
    // 1. Validar integridad referencial cruzada (Asegurarnos de que el ID de empresa no es inventado)
    const company = await this.pgCompanyRepo.findOneBy({
      id: service.companyId,
    });

    if (!company)
      throw new Error("La empresa solicitada no existe en los registros.");

    // 2. Guardado relacional en Postgres
    const pgService = this.pgServiceRepo.create({
      id: service.id,
      companyId: service.companyId,
      name: service.name,
      inputSchema: service.inputSchema,
      isActive: service.isActive,
    });
    await this.pgServiceRepo.save(pgService);

    // 3. CQRS: Construimos y guardamos la "Proyección" en MongoDB
    // Aquí es donde unimos datos de tablas separadas para que el Frontend no tenga que procesarlo.
    await CatalogServiceModel.findOneAndUpdate(
      { serviceId: service.id },
      {
        serviceId: service.id,
        companyId: company.id,
        companyName: company.name, // Dato cruzado
        serviceName: service.name,
        inputSchema: service.inputSchema,
      },
      { upsert: true },
    );
  }

  async findByCompanyId(companyId: string): Promise<Service[]> {
    // Pendiente de implementar si requerimos filtrar desde Postgres internamente
    return [];
  }
}
