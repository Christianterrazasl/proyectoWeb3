import { Service } from "../../domain/models/Service.js";
import { AppDataSource } from "../database/connection.js";
import { ServiceEntity } from "../database/postgres/ServiceEntity.js";
import { CompanyEntity } from "../database/postgres/CompanyEntity.js";
import { CatalogServiceModel } from "../database/mongodb/CatalogServiceSchema.js";

/**
 * Implementación concreta del Repositorio de Servicios.
 */
export class ServiceRepositoryImpl {
  constructor() {
    this.pgServiceRepo = AppDataSource.getRepository(ServiceEntity);
    this.pgCompanyRepo = AppDataSource.getRepository(CompanyEntity);
  }

  async save(service) {
    const company = await this.pgCompanyRepo.findOneBy({
      id: service.companyId,
    });

    if (!company)
      throw new Error("La empresa solicitada no existe en los registros.");

    const pgService = this.pgServiceRepo.create({
      id: service.id,
      companyId: service.companyId,
      name: service.name,
      inputSchema: service.inputSchema,
      isPublished: service.isPublished,
    });
    await this.pgServiceRepo.save(pgService);

    await CatalogServiceModel.findOneAndUpdate(
      { serviceId: service.id },
      {
        serviceId: service.id,
        companyId: company.id,
        companyName: company.name, // Dato cruzado
        companyNit: company.nit,
        companyStatus: company.status,
        companyActive: company.active,
        companyLogoUrl: company.logoUrl,
        serviceName: service.name,
        inputSchema: service.inputSchema,
        isPublished: service.isPublished,
      },
      { upsert: true },
    );
  }

  async findByCompanyId(companyId) {
    return this.readProjection({ companyId });
  }

  async findAll() {
    return this.readProjection();
  }

  async readProjection(filter = {}) {
    return CatalogServiceModel.find(filter, "-_id -__v")
      .sort({ companyName: 1, serviceName: 1 })
      .lean();
  }

  async findByCompanyId(companyId) {
    return await CatalogServiceModel.find(
      { companyId },
      { _id: 0, __v: 0 },
    ).lean();
  }

  async findById(serviceId) {
    const doc = await CatalogServiceModel.findOne({ serviceId });
    if (!doc) return null;

    return new Service(
      doc.serviceId,
      doc.companyId,
      doc.name,
      doc.inputSchema,
      doc.active,
    );
  }

  // EDICIÓN DE SERVICIO
  async update(id, serviceData) {
    const pgRepo = getPostgresConnection().getRepository(ServiceEntity);

    const pgData = {};
    if (serviceData.name) pgData.name = serviceData.name;
    if (serviceData.inputSchema) pgData.inputSchema = serviceData.inputSchema;
    if (serviceData.active !== undefined) pgData.active = serviceData.active;

    await pgRepo.update({ id }, pgData);
    await CatalogServiceModel.updateOne(
      { serviceId: id },
      { $set: serviceData },
    );
  }

  async findByIdForRead(serviceId) {
    return await CatalogServiceModel.findOne(
      { serviceId },
      { _id: 0, __v: 0 },
    ).lean();
  }

  async findAllActiveForRead() {
    return await CatalogServiceModel.find(
      { isPublished: true, companyStatus: "APPROVED", companyActive: true },
      { _id: 0, __v: 0 },
    ).lean();
  }

  async findAllForRead() {
    return await CatalogServiceModel.find({}, { _id: 0, __v: 0 }).lean();
  }
}
