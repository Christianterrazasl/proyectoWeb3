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

    return services.reduce((catalog, service) => {
      const company = companies.find(
        (candidate) => candidate.companyId === service.companyId,
      );
      const companyName = String(company?.name || service.companyName || "").trim();

      if (!companyName) {
        return catalog;
      }

      catalog.push({
        id: service.serviceId || service.id,
        name: service.serviceName || service.name,
        companyId: service.companyId,
        companyName,
        inputSchema: service.inputSchema,
        category: service.category || "",
        description: service.description || "",
        logoUrl: service.companyLogoUrl || "",
      });

      return catalog;
    }, []);
  }
}
