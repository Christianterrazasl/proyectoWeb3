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
      const company = companies.find(
        (c) => c.companyId === service.companyId,
      );
      return {
        id: service.serviceId || service.id,
        name: service.serviceName || service.name,
        companyId: service.companyId,
        companyName: company?.name || service.companyName || "Desconocida",
        inputSchema: service.inputSchema,
        category: service.category || "",
        description: service.description || "",
        logoUrl: service.companyLogoUrl || "",
      }

    });
  }
}
