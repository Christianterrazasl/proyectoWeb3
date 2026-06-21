import { CommandHandler } from "../../shared/core/CommandHandler.js";

export class UpdateServiceCommand extends CommandHandler {
  constructor(serviceRepository) {
    super();
    this.serviceRepository = serviceRepository;
  }

  async execute(id, data) {
    const service = await this.serviceRepository.findById(id);
    if (!service) throw new Error("Servicio no encontrado");

    if (data.name) service.changeName(data.name);
    if (data.inputSchema) service.updateSchema(data.inputSchema);

    if (data.active !== undefined) {
      data.active ? service.activate() : service.deactivate();
    }

    await this.serviceRepository.update(id, service);

    return { id: service.id, name: service.name, active: service.active };
  }
}
