import { Company } from "../../domain/models/Company.js";

export class CompanyController {
  constructor(companyRepository, serviceRepository, createServiceHandler) {
    this.companyRepository = companyRepository;
    this.serviceRepository = serviceRepository;
    this.createServiceHandler = createServiceHandler;
  }

  /**
   * POST /api/admin/services
   * Crea un servicio dentro de la empresa que auth ya validó.
   */
  async createService(req, res) {
    try {
      if (req.companyId === null || req.companyId === undefined) {
        return res.status(400).json({
          success: false,
          message:
            "Debes enviar X-Company-Id o seleccionar una empresa activa en la sesión.",
        });
      }

      const scopedCompany = req.authContext?.accessible_companies?.find(
        (company) => company.id === req.companyId,
      );

      if (!scopedCompany) {
        return res.status(403).json({
          success: false,
          message: "La empresa solicitada no pertenece al contexto autenticado.",
        });
      }

      // Guardamos una referencia canónica de la empresa validada por auth.
      await this.companyRepository.save(
        new Company(
          scopedCompany.id,
          scopedCompany.name,
          scopedCompany.nit,
          scopedCompany.status,
          scopedCompany.active,
          new Date(),
          new Date(),
          scopedCompany.logo_url ?? null,
        ),
      );

      const newService = await this.createServiceHandler.execute({
        companyId: req.companyId,
        name: req.body.name,
        fields: req.body.inputSchema?.fields ?? req.body.fields,
        isPublished: req.body.isPublished,
      });

      return res.status(201).json({
        success: true,
        data: newService,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/admin/services
   * Lo consumen el panel admin y reportes para reutilizar una sola vista operativa.
   * Catálogo expone esta lectura porque sigue siendo dueño de los metadatos del servicio.
   */
  async getAdminServices(req, res) {
    try {
      // Solo filtramos si el cliente pidió scope explícito con el header.
      // Sin `X-Company-Id`, el admin conserva visión global sobre todos los servicios.
      const requestedCompanyId = req.header("x-company-id") ? req.companyId : null;

      const services = requestedCompanyId
        ? await this.serviceRepository.findByCompanyId(requestedCompanyId)
        : await this.serviceRepository.findAll();

      return res.status(200).json({
        success: true,
        data: services,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "No se pudo obtener la lista administrativa de servicios.",
      });
    }
  }

  /**
   * GET /api/catalog/services
   * Lectura pública del catálogo.
   */
  async getCatalog(req, res) {
    try {
      const { CatalogServiceModel } = await import(
        "../../infrastructure/database/mongodb/CatalogServiceSchema.js"
      );

      const catalog = await CatalogServiceModel.find({}, "-_id -__v").lean();

      return res.status(200).json({
        success: true,
        data: catalog,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error interno al obtener el catálogo.",
      });
    }
  }
}
