import { CommandHandler } from "../../shared/core/CommandHandler.js";
import { Service } from "../../domain/models/Service.js";

export class CreateServiceCommand extends CommandHandler {
  constructor(serviceRepository) {
    super();
    this.serviceRepository = serviceRepository;
  }

  async execute(data) {
    const service = Service.create(
      data.id,
      data.companyId,
      data.name,
      data.inputSchema,
    );

    await this.serviceRepository.save(service);

    return { id: service.id, name: service.name, active: service.active };
  }
}
