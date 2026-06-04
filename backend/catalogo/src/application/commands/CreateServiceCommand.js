import { Service } from "../../domain/models/Service.js";

/**
 * Caso de Uso: Registrar un nuevo servicio en el catálogo de Multipagos.
 * DTO esperado en el execute: { companyId, name, fields }
 */
export class CreateServiceCommandHandler {
  constructor(serviceRepository) {
    this.serviceRepository = serviceRepository;
  }

  async execute(dto) {
    // Validamos que el servicio contenga al menos un campo de identificación (ej. nro_cliente)
    if (!dto.companyId || !dto.name || !dto.fields || dto.fields.length === 0) {
      throw new Error(
        "Datos incompletos. Un servicio requiere al menos un campo en su esquema.",
      );
    }

    // TODO: Mover a generador de identificadores robusto (uuid)
    const serviceId = `srv-${Date.now()}`;

    // Instanciamos la entidad de dominio del Servicio
    const newService = new Service(
      serviceId,
      dto.companyId,
      dto.name,
      { fields: dto.fields },
      true, // El servicio nace activo para ser listado en el catálogo
    );

    // Persistimos el servicio. El repositorio actualizará Postgres y aplanará la vista en Mongo.
    await this.serviceRepository.save(newService);

    return newService;
  }
}
