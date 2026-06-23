import { QueryHandler } from "../../shared/core/QueryHandler.js";

export class ListAdminServicesQuery extends QueryHandler {
  constructor(serviceRepository) {
    super();
    this.serviceRepository = serviceRepository;
  }

  async execute(criteria = {}) {
    const companyId = criteria?.companyId ?? null;

    if (companyId !== null && companyId !== undefined) {
      return await this.serviceRepository.findByCompanyId(companyId);
    }

    if (typeof this.serviceRepository.findAllForRead === "function") {
      return await this.serviceRepository.findAllForRead();
    }

    return await this.serviceRepository.findAll();
  }
}
