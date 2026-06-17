export class ListAdminServicesQuery {
  constructor(serviceRepository) {
    this.serviceRepository = serviceRepository;
  }

  async execute({ companyId } = {}) {
    if (companyId === null || companyId === undefined) {
      return this.serviceRepository.findAll();
    }

    return this.serviceRepository.findByCompanyId(companyId);
  }
}
