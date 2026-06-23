import { QueryHandler } from "../../shared/core/QueryHandler.js";

export class GetCompanyServicesQuery extends QueryHandler {
  constructor(serviceRepository) {
    super();
    this.serviceRepository = serviceRepository;
  }

  async execute(companyId) {
    const resolvedCompanyId =
      companyId !== null && typeof companyId === "object"
        ? companyId.companyId
        : companyId;

    const services = await this.serviceRepository.findByCompanyId(resolvedCompanyId);
    return services;
  }
}
