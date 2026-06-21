import { QueryHandler } from "../../shared/core/QueryHandler.js";

export class GetServiceByIdQuery extends QueryHandler {
  constructor(serviceRepository) {
    super();
    this.serviceRepository = serviceRepository;
  }

  async execute(id) {
    return await this.serviceRepository.findByIdForRead(id);
  }
}
