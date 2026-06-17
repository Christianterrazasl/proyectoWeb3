export class GetCompanyServicesQuery {
  constructor(serviceRepository) {
    this.serviceRepository = serviceRepository;
  }

  async execute({ companyId }) {
    return this.serviceRepository.findByCompanyId(companyId);
  }
}
