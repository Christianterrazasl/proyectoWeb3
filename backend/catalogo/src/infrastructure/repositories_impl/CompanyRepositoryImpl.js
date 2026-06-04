import { Company } from "../../domain/models/Company.js";
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
        logoUrl: company.logoUrl,
      },
      { upsert: true, new: true },
    );
  }

  async update(company) {
    await this.pgRepository.save(company);
    await CompanyModel.findOneAndUpdate(
      { companyId: company.id },
      { name: company.name, status: company.status, logoUrl: company.logoUrl },
    );
  }

  // === QUERIES INTERNAS PARA LÓGICA DE NEGOCIO (Usan Postgres para evitar latencia de sincronización) ===

  async findByNit(nit) {
    const pgCompany = await this.pgRepository.findOneBy({ nit });
    if (!pgCompany) return null;
    return new Company(
      pgCompany.id,
      pgCompany.name,
      pgCompany.nit,
      pgCompany.status,
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
    const mongoDocs = await CompanyModel.find({ status: "ACTIVE" }).lean();

    return mongoDocs.map(
      (doc) =>
        new Company(
          doc.companyId,
          doc.name,
          doc.nit,
          doc.status,
          new Date(),
          new Date(),
          doc.logoUrl,
        ),
    );
  }
}
