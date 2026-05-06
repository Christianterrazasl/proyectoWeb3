// src/application/commands/CreateServiceCommand.ts
import { Service, IInputSchemaField } from "../../domain/models/Service";
import { IServiceRepository } from "../../domain/repositories/IServiceRepository";

/**
 * DTO para la creación de un nuevo servicio asociado a una empresa.
 * Garantiza la estructura requerida para configurar el input_schema dinámico del frontend.
 */
export interface CreateServiceDTO {
  companyId: string;
  name: string;
  fields: IInputSchemaField[];
}

/**
 * Caso de Uso: Registrar un nuevo servicio en el catálogo de Multipagos.
 */
export class CreateServiceCommandHandler {
  constructor(private readonly serviceRepository: IServiceRepository) {}

  async execute(dto: CreateServiceDTO): Promise<Service> {
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
