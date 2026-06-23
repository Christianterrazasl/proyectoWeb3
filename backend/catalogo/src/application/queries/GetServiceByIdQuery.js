import { QueryHandler } from "../../shared/core/QueryHandler.js";

export class GetServiceByIdQuery extends QueryHandler {
  constructor(serviceRepository) {
    super();
    this.serviceRepository = serviceRepository;
  }

  async execute(id) {
    const resolvedId = id !== null && typeof id === "object" ? (id.serviceId ?? id.id) : id;

    if (typeof this.serviceRepository.findByIdForRead === "function") {
      return await this.serviceRepository.findByIdForRead(resolvedId);
    }

    return await this.serviceRepository.findById(resolvedId);
  }
}
