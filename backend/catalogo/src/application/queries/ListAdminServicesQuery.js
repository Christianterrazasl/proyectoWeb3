import { QueryHandler } from "../../shared/core/QueryHandler.js";

export class ListAdminServicesQuery extends QueryHandler {
  constructor(serviceRepository) {
    super();
    this.serviceRepository = serviceRepository;
  }

  async execute() {
    return await this.serviceRepository.findAllForRead();
  }
}
