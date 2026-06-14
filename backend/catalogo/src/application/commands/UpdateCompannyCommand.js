export class UpdateCompanyCommand {
  constructor(companyRepository) {
    this.companyRepository = companyRepository;
  }

  async execute(id, data) {
    const company = await this.companyRepository.findById(id);
    if (!company) throw new Error("La empresa no existe");

    await this.companyRepository.update(id, data);
    return { id, ...data };
  }
}
