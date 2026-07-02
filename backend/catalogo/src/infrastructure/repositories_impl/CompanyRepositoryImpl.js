import { Company } from "../../domain/models/Company.js";
import { CompanyModel } from "../database/mongodb/CompanySchema.js";
import { CompanyEntity } from "../database/postgres/CompanyEntity.js";
//import { getPostgresConnection } from "../database/connection.js";
import { AppDataSource } from "../database/connection.js";

export class CompanyRepositoryImpl {
  async findById(id) {
    const doc = await CompanyModel.findOne({ companyId: id });
    if (!doc) return null;
    return new Company(doc.id, doc.name, doc.status);
  }

  async save(company) {
    const pgRepo = AppDataSource.getRepository(CompanyEntity);
    const newCompany = pgRepo.create({
      id: company.id,
      name: company.name,
      status: company.status,
    });
    await pgRepo.save(newCompany);

    const mongoDoc = new CompanyModel({
      companyId: company.id,
      name: company.name,
      nit: company.nit,
      status: company.status,
      active: company.active,
      logoUrl: company.logoUrl || null,
    });
    await mongoDoc.save();
  }

  async update(id, company) {
    const pgRepo = AppDataSource.getRepository(CompanyEntity);
    await pgRepo.update({ id }, { name: company.name, status: company.status });
    await CompanyModel.updateOne(
      { companyId: id },
      {
        $set: {
          name: company.name,
          nit: company.nit,
          status: company.status,
          active: company.active,
          logoUrl: company.logoUrl || null,
        },
      },
    );
  }

  async findAllForRead() {
    return await CompanyModel.find(
      { status: "APPROVED" },
      { _id: 0, __v: 0 },
    ).lean();
  }
}
