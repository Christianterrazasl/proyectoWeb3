import { QueryHandler } from "../../shared/core/QueryHandler.js";

export class ListAdminServicesQuery extends QueryHandler {
  constructor(serviceRepository) {
    super();
    this.serviceRepository = serviceRepository;
  }

  async execute(tenantId = null) {
    const resolvedTenantId =
      tenantId !== null && typeof tenantId === "object"
        ? tenantId.companyId
        : tenantId;

    if (resolvedTenantId) {
      return await this.serviceRepository.findByCompanyId(resolvedTenantId);
    }

    return await this.serviceRepository.findAllForRead();
  }
}
