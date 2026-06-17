import { Company } from "../../domain/entities/Company.js";
import { AppDataSource } from "../database/connection.js";
import { CompanyEntity } from "../database/postgres/CompanyEntity.js";
import { CompanyModel } from "../database/mongodb/CompanySchema.js";

/**
 * Implementación concreta del Repositorio de Empresas.
 * EQUIPO: Aquí gestionamos la arquitectura Polyglot Persistence (Postgres + Mongo).
 */
export class CompanyRepositoryImpl {
  constructor() {
    this.pgRepository = AppDataSource.getRepository(CompanyEntity);
  }

  /**
   * COMANDO DE ESCRITURA
   * Guarda en PostgreSQL primero (transaccionalidad estricta) y luego sincroniza hacia MongoDB (proyección).
   */
  async save(company) {
    // 1. Persistencia estricta en la fuente de la verdad (Postgres)
    const pgCompany = this.pgRepository.create({
      id: company.id,
      name: company.name,
      nit: company.nit,
      status: company.status,
      active: company.active,
      logoUrl: company.logoUrl,
    });

    await this.pgRepository.save(pgCompany);

    // 2. Sincronización a la base de datos de lectura (MongoDB)
    // Upsert = Si no existe, créalo. Si existe, actualízalo.
    await CompanyModel.findOneAndUpdate(
      { companyId: company.id },
      {
        companyId: company.id,
        name: company.name,
        nit: company.nit,
        status: company.status,
        active: company.active,
        logoUrl: company.logoUrl,
      },
      { upsert: true, new: true },
    );
  }

  async findByNit(nit) {
    const pgCompany = await this.pgRepository.findOneBy({ nit });
    if (!pgCompany) return null;
    return new Company(
      pgCompany.id,
      pgCompany.name,
      pgCompany.nit,
      pgCompany.status,
      pgCompany.active,
      pgCompany.createdAt,
      pgCompany.updatedAt,
      pgCompany.logoUrl,
    );
  }

  async findById(id) {
    const pgCompany = await this.pgRepository.findOneBy({ id });
    if (!pgCompany) return null;
    return new Company(
      pgCompany.id,
      pgCompany.name,
      pgCompany.nit,
      pgCompany.status,
      pgCompany.active,
      pgCompany.createdAt,
      pgCompany.updatedAt,
      pgCompany.logoUrl,
    );
  }

  /**
   * QUERY DE LECTURA PÚBLICA
   * Para alimentar el frontend rápidamente, leemos directamente de MongoDB.
   */
  async findAll() {
    const mongoDocs = await CompanyModel.find({
      status: "APPROVED",
      active: true,
    }).lean();

    return mongoDocs.map(
      (doc) =>
        new Company(
          doc.companyId,
          doc.name,
          doc.nit,
          doc.status,
          doc.active,
          new Date(),
          new Date(),
          doc.logoUrl,
        ),
    );
  }

  // Doble escritura para la edición
  async update(id, companyData) {
    const pgData = {};
    if (companyData.name) pgData.name = companyData.name;
    if (companyData.nit) pgData.nit = companyData.nit;
    if (companyData.status) pgData.status = companyData.status;
    if (companyData.active !== undefined) pgData.active = companyData.active;
    if (companyData.logoUrl !== undefined) pgData.logoUrl = companyData.logoUrl;

    // 1. Actualiza en PostgreSQL (Fuente de verdad)
    await this.pgRepository.update({ id }, pgData);
    // 2. Actualiza en MongoDB (Lectura rápida)
    await CompanyModel.updateOne({ companyId: id }, { $set: companyData });
  }
}
