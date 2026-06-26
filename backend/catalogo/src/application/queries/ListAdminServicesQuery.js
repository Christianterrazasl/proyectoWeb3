import { QueryHandler } from "../../shared/core/QueryHandler.js";

export class ListAdminServicesQuery extends QueryHandler {
  constructor(serviceRepository) {
    super();
    this.serviceRepository = serviceRepository;
  }

  async execute(tenantId = null) {
    if (tenantId) {
      return await this.serviceRepository.findByCompanyId(tenantId);
    }
    return await this.serviceRepository.findAllForRead();
  }
}
