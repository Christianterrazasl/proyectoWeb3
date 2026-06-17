import { Company } from "../../domain/models/Company.js";
import { UpdateCompanyCommand } from "../../application/commands/UpdateCompanyCommand.js";
import { UpdateServiceCommand } from "../../application/commands/UpdateServiceCommand.js";
import { ListAdminServicesQuery } from "../../application/queries/ListAdminServicesQuery.js";
import { GetCatalogQuery } from "../../application/queries/GetCatalogQuery.js";
import { GetCompanyServicesQuery } from "../../application/queries/GetCompanyServicesQuery.js";
import { GetServiceByIdQuery } from "../../application/queries/GetServiceByIdQuery.js";

export class CompanyController {
  constructor(
    companyRepository,
    serviceRepository,
    createServiceHandler,
    queries = {},
  ) {
    this.companyRepository = companyRepository;
    this.serviceRepository = serviceRepository;
    this.createServiceHandler = createServiceHandler;
    this.listAdminServicesQuery =
      queries.listAdminServicesQuery ??
      new ListAdminServicesQuery(serviceRepository);
    this.getCatalogQuery =
      queries.getCatalogQuery ?? new GetCatalogQuery(serviceRepository);
    this.getCompanyServicesQuery =
      queries.getCompanyServicesQuery ??
      new GetCompanyServicesQuery(serviceRepository);
    this.getServiceByIdQuery =
      queries.getServiceByIdQuery ?? new GetServiceByIdQuery(serviceRepository);
  }

  /**
   * POST /api/admin/services
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
          message:
            "La empresa solicitada no pertenece al contexto autenticado.",
        });
      }

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
   */
  async getAdminServices(req, res) {
    try {
      const requestedCompanyId = req.header("x-company-id")
        ? req.companyId
        : null;

      const services = await this.listAdminServicesQuery.execute({
        companyId: requestedCompanyId,
      });

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
   */
  async getCatalog(req, res) {
    try {
      const catalog = await this.getCatalogQuery.execute();

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

  async updateCompany(req, res) {
    try {
      const command = new UpdateCompanyCommand(this.companyRepository);
      const result = await command.execute(req.params.id, req.body);
      res
        .status(200)
        .json({ success: true, message: "Empresa actualizada", data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateService(req, res) {
    try {
      const command = new UpdateServiceCommand(this.serviceRepository);
      const result = await command.execute(req.params.id, req.body);
      res
        .status(200)
        .json({ success: true, message: "Servicio actualizado", data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getCompanyServices(req, res) {
    try {
      const services = await this.getCompanyServicesQuery.execute({
        companyId: req.params.companyId,
      });
      res.status(200).json({ success: true, data: services });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getServiceById(req, res) {
    try {
      const service = await this.getServiceByIdQuery.execute({
        serviceId: req.params.id,
      });
      if (!service)
        return res
          .status(404)
          .json({ success: false, message: "Servicio no encontrado" });

      res.status(200).json({ success: true, data: service });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
