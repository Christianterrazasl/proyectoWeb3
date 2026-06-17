export class GetCatalogQuery {
  constructor(serviceRepository) {
    this.serviceRepository = serviceRepository;
  }

  async execute() {
    return this.serviceRepository.findAll();
  }
}
