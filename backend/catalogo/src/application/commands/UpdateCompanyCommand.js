import { CommandHandler } from "../../shared/core/CommandHandler.js";

export class UpdateCompanyCommand extends CommandHandler {
  constructor(companyRepository) {
    super();
    this.companyRepository = companyRepository;
  }

  async execute(id, data) {
    const company = await this.companyRepository.findById(id);
    if (!company) throw new Error("La empresa no existe");

    if (data.name) company.changeName(data.name);

    if (data.status !== undefined) {
      data.status === "ACTIVE" ? company.activate() : company.deactivate();
    }

    await this.companyRepository.update(id, company);

    return { id: company.id, name: company.name, status: company.status };
  }
}
