import { CommandHandler } from "../../shared/core/CommandHandler.js";
import { Company } from "../../domain/models/Company.js";

export class CreateCompanyCommand extends CommandHandler {
  constructor(companyRepository) {
    super();
    this.companyRepository = companyRepository;
  }

  async execute(data) {
    const company = Company.create(data.id, data.name);

    await this.companyRepository.save(company);

    return { id: company.id, name: company.name, status: company.status };
  }
}
