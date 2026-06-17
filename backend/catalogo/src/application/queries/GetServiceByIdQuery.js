export class GetServiceByIdQuery {
  constructor(serviceRepository) {
    this.serviceRepository = serviceRepository;
  }

  async execute({ serviceId }) {
    return this.serviceRepository.findById(serviceId);
  }
}
