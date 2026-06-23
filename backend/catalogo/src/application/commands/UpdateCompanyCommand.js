import { CommandHandler } from "../../shared/CommandHandler.js";

export class UpdateCompanyCommand extends CommandHandler {
  constructor(companyRepository) {
    super();
    this.companyRepository = companyRepository;
  }

  async execute(id, data) {
    const company = await this.companyRepository.findById(id);
    if (!company) throw new Error("La empresa no existe");

    if (data.name) {
      if (typeof company.changeName === "function") {
        company.changeName(data.name);
      } else {
        company.name = data.name;
      }
    }

    if (data.status !== undefined) {
      if (data.status === "ACTIVE") {
        if (typeof company.activate === "function") {
          company.activate();
        } else {
          company.status = "ACTIVE";
        }
      } else if (typeof company.deactivate === "function") {
        company.deactivate();
      } else {
        company.status = "INACTIVE";
      }
    }

    await this.companyRepository.update(id, company);

    return {
      id: company.id,
      name: company.name,
      ...(company.status !== undefined ? { status: company.status } : {}),
    };
  }
}
