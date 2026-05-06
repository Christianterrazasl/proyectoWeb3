// src/application/commands/CreateCompanyCommand.ts
import { Company } from "../../domain/models/Company";
import { ICompanyRepository } from "../../domain/repositories/ICompanyRepository";

/**
 * DTO (Data Transfer Object) para la creación de empresas.
 * Define el contrato estricto de los datos que la capa de presentación debe enviar a este caso de uso.
 */
export interface CreateCompanyDTO {
  name: string;
  nit: string;
  logoUrl?: string;
}

/**
 * Caso de Uso: Registrar una nueva empresa.
 * Orquesta las validaciones de negocio y delega la persistencia al repositorio.
 */
export class CreateCompanyCommandHandler {
  // El repositorio se inyecta como interfaz para mantener el principio de inversión de dependencias.
  constructor(private readonly companyRepository: ICompanyRepository) {}

  async execute(dto: CreateCompanyDTO): Promise<Company> {
    // Validaciones estructurales básicas
    if (!dto.name || !dto.nit) {
      throw new Error("El nombre y el NIT son obligatorios.");
    }

    // Validación de negocio: Evitar registrar una empresa con un NIT duplicado
    const existingCompany = await this.companyRepository.findByNit(dto.nit);
    if (existingCompany) {
      throw new Error(
        `La empresa con NIT ${dto.nit} ya está registrada en el sistema.`,
      );
    }

    // TODO: En fases posteriores, cambiar la generación de ID por una librería como uuid o cuid.
    const companyId = `cmp-${Date.now()}`;

    // Creación de la entidad de dominio
    const newCompany = new Company(
      companyId,
      dto.name,
      dto.nit,
      "ACTIVE", // Toda empresa nueva entra activa por defecto
      new Date(),
      new Date(),
      dto.logoUrl,
    );

    // Persistencia. Nota: El repositorio subyacente maneja la sincronización dual (Postgres + Mongo).
    await this.companyRepository.save(newCompany);

    return newCompany;
  }
}
