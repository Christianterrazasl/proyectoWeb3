import { QueryHandler } from "../../shared/core/QueryHandler.js";

export class GetCompanyServicesQuery extends QueryHandler {
  constructor(serviceRepository) {
    super();
    this.serviceRepository = serviceRepository;
  }

  async execute(companyId) {
    const services = await this.serviceRepository.findByCompanyId(companyId);
    return services;
  }
}
