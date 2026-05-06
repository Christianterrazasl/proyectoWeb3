// src/api/controllers/CompanyController.ts
import { Request, Response } from "express";
import { CreateCompanyCommandHandler } from "../../application/commands/CreateCompanyCommand";
import { ICompanyRepository } from "../../domain/repositories/ICompanyRepository";
import { CreateServiceCommandHandler } from "../../application/commands/CreateServiceCommand";
import { CatalogServiceModel } from "../../infrastructure/database/mongodb/CatalogServiceSchema";

/**
 * Controlador para el dominio de Empresas y Servicios.
 * Actúa como la capa de presentación (API). Su única responsabilidad es
 * orquestar los handlers (Commands) y manejar las respuestas HTTP, sin incluir lógica de negocio.
 */
export class CompanyController {
  // Inyección de dependencias mediante el constructor para facilitar el testing.
  constructor(
    private readonly createCompanyHandler: CreateCompanyCommandHandler,
    private readonly companyRepository: ICompanyRepository,
    private readonly createServiceHandler: CreateServiceCommandHandler,
  ) {}

  /**
   * POST /api/admin/companies
   * Registra una nueva empresa proveedora en el sistema (Operación de Escritura).
   */
  async createCompany(req: Request, res: Response): Promise<void> {
    try {
      // Delegamos la ejecución estructural y de negocio al caso de uso correspondiente
      const newCompany = await this.createCompanyHandler.execute({
        name: req.body.name,
        nit: req.body.nit,
        logoUrl: req.body.logoUrl,
      });

      res.status(201).json({
        success: true,
        message: "Empresa dada de alta en el sistema multi-tenant.",
        data: newCompany,
      });
    } catch (error: any) {
      // Capturamos errores de dominio (ej. NIT duplicado o validaciones fallidas)
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /api/catalog/services
   * Registra un nuevo servicio asociado a una empresa existente.
   */
  async createService(req: Request, res: Response): Promise<void> {
    try {
      const newService = await this.createServiceHandler.execute({
        companyId: req.body.companyId,
        name: req.body.name,
        fields: req.body.fields,
      });

      res.status(201).json({ success: true, data: newService });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * GET /api/catalog/services
   * Obtiene el catálogo completo (Operación de Lectura).
   * Nota para el equipo: Para maximizar el rendimiento (CQRS), esta consulta va
   * directo a la vista proyectada en MongoDB, saltándose PostgreSQL.
   */
  async getCatalog(req: Request, res: Response): Promise<void> {
    try {
      const catalog = await CatalogServiceModel.find({}, "-_id -__v").lean();
      res.status(200).json({ success: true, data: catalog });
    } catch (error: any) {
      res
        .status(500)
        .json({
          success: false,
          message: "Error interno al obtener el catálogo.",
        });
    }
  }
}
