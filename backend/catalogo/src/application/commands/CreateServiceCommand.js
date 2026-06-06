import { Service } from "../../domain/models/Service.js";

/**
 * Caso de Uso: Registrar un nuevo servicio en el catálogo de Multipagos.
 * DTO esperado en el execute: { companyId, name, fields, isPublished }
 */
export class CreateServiceCommandHandler {
  constructor(serviceRepository) {
    this.serviceRepository = serviceRepository;
  }

  async execute(dto) {
    // Validamos que el servicio contenga al menos un campo de identificación (ej. nro_cliente)
    if (!Number.isInteger(dto.companyId) || !dto.name || !dto.fields || dto.fields.length === 0) {
      throw new Error(
        "Datos incompletos. Un servicio requiere al menos un campo en su esquema.",
      );
    }

    const duplicatedField = dto.fields.find(
      (field, index) =>
        dto.fields.findIndex((candidate) => candidate.name === field.name) !== index,
    );

    if (duplicatedField) {
      throw new Error("Los campos del esquema deben tener nombres únicos.");
    }

    // TODO: Mover a generador de identificadores robusto (uuid)
    const serviceId = `srv-${Date.now()}`;

    // Instanciamos la entidad de dominio del Servicio
    const newService = new Service(
      serviceId,
      dto.companyId,
      dto.name,
      { fields: dto.fields },
      dto.isPublished ?? true,
    );

    // Persistimos el servicio. El repositorio actualizará Postgres y aplanará la vista en Mongo.
    await this.serviceRepository.save(newService);

    return newService;
  }
}
