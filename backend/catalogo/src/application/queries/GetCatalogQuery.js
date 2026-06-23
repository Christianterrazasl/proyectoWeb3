import { QueryHandler } from "../../shared/core/QueryHandler.js";

export class GetCatalogQuery extends QueryHandler {
  constructor(serviceRepository) {
    super();
    this.serviceRepository = serviceRepository;
  }

  async execute() {
    if (typeof this.serviceRepository.findAllActiveForRead === "function") {
      return await this.serviceRepository.findAllActiveForRead();
    }

    return await this.serviceRepository.findAll();
  }
}
