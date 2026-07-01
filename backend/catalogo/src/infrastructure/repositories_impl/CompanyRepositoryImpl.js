import { Company } from "../../domain/models/Company.js";
import { CompanyModel } from "../database/mongodb/CompanySchema.js";
import { CompanyEntity } from "../database/postgres/CompanyEntity.js";
import { getPostgresConnection } from "../database/connection.js";

export class CompanyRepositoryImpl {
  async findById(id) {
    const doc = await CompanyModel.findOne({ id });
    if (!doc) return null;
    return new Company(doc.id, doc.name, doc.status);
  }

  async save(company) {
    const pgRepo = getPostgresConnection().getRepository(CompanyEntity);
    const newCompany = pgRepo.create({
      id: company.id,
      name: company.name,
      status: company.status,
    });
    await pgRepo.save(newCompany);

    const mongoDoc = new CompanyModel({
      id: company.id,
      name: company.name,
      status: company.status,
    });
    await mongoDoc.save();
  }

  async update(id, company) {
    const pgRepo = getPostgresConnection().getRepository(CompanyEntity);
    await pgRepo.update({ id }, { name: company.name, status: company.status });
    await CompanyModel.updateOne(
      { id },
      { $set: { name: company.name, status: company.status } },
    );
  }

  async findAllForRead() {
    return await CompanyModel.find(
      { status: "APPROVED" },
      { _id: 0, __v: 0 },
    ).lean();
  }
}
