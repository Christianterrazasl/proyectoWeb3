import { QueryHandler } from "../../shared/core/QueryHandler.js";

export class GetCatalogQuery extends QueryHandler {
  constructor(serviceRepository, companyRepository) {
    super();
    this.serviceRepository = serviceRepository;
    this.companyRepository = companyRepository;
  }

  async execute() {
    const services = await this.serviceRepository.findAllActiveForRead();
    const companies = await this.companyRepository.findAllForRead();

    return services.map((service) => {
      const company = companies.find((c) => c.id === service.companyId);
      return {
        serviceId: service.serviceId || service.id,
        serviceName: service.name,
        companyId: service.companyId,
        companyName: company ? company.name : "Desconocida",
        inputSchema: service.inputSchema,
      };
    });
  }
}
