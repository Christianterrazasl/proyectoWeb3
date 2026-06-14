export class UpdateServiceCommand {
  constructor(serviceRepository) {
    this.serviceRepository = serviceRepository;
  }

  async execute(id, data) {
    if (data.inputSchema && !Array.isArray(data.inputSchema.fields)) {
      throw new Error("El inputSchema debe contener un array de 'fields'");
    }
    await this.serviceRepository.update(id, data);
    return { id, ...data };
  }
}
