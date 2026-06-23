import { CreateCompanyCommand } from "../../application/commands/CreateCompanyCommand.js";
import { UpdateCompanyCommand } from "../../application/commands/UpdateCompanyCommand.js";
import { CreateServiceCommand } from "../../application/commands/CreateServiceCommand.js";
import { UpdateServiceCommand } from "../../application/commands/UpdateServiceCommand.js";

import { GetCatalogQuery } from "../../application/queries/GetCatalogQuery.js";
import { GetServiceByIdQuery } from "../../application/queries/GetServiceByIdQuery.js";
import { GetCompanyServicesQuery } from "../../application/queries/GetCompanyServicesQuery.js";
import { ListAdminServicesQuery } from "../../application/queries/ListAdminServicesQuery.js";

export class CompanyController {
  constructor(
    companyRepository,
    serviceRepository,
    _legacyDependencies = null,
    queryOverrides = {},
  ) {
    this.companyRepository = companyRepository;
    this.serviceRepository = serviceRepository;
    this.queryOverrides = queryOverrides ?? {};
  }

  _resolveQuery(name, factory) {
    return this.queryOverrides[name] ?? factory();
  }

  async _handleRequest(res, handler, ...args) {
    try {
      const result = await handler.execute(...args);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // --- ESCRITURA (Commands) ---
  async createCompany(req, res) {
    const command = new CreateCompanyCommand(this.companyRepository);
    await this._handleRequest(res, command, req.body);
  }

  async updateCompany(req, res) {
    const command = new UpdateCompanyCommand(this.companyRepository);
    await this._handleRequest(res, command, req.params.id, req.body);
  }

  async createService(req, res) {
    const command = new CreateServiceCommand(this.serviceRepository);
    await this._handleRequest(res, command, req.body);
  }

  async updateService(req, res) {
    const command = new UpdateServiceCommand(this.serviceRepository);
    await this._handleRequest(res, command, req.params.id, req.body);
  }

  // --- LECTURA (Queries) ---
  async getPublicCatalog(req, res) {
    const query = this._resolveQuery(
      "getCatalogQuery",
      () => new GetCatalogQuery(this.serviceRepository),
    );
    await this._handleRequest(res, query);
  }

  async getCatalog(req, res) {
    await this.getPublicCatalog(req, res);
  }

  async getServiceById(req, res) {
    try {
      const query = this._resolveQuery(
        "getServiceByIdQuery",
        () => new GetServiceByIdQuery(this.serviceRepository),
      );
      const result = await query.execute(req.params.id);

      if (!result) {
        res.status(404).json({ success: false, message: "Servicio no encontrado" });
        return;
      }

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getCompanyServices(req, res) {
    const query = new GetCompanyServicesQuery(this.serviceRepository);
    await this._handleRequest(res, query, req.params.companyId);
  }

  async listAdminServices(req, res) {
    const query = this._resolveQuery(
      "listAdminServicesQuery",
      () => new ListAdminServicesQuery(this.serviceRepository),
    );

    const rawCompanyId = req?.companyId ?? req?.params?.companyId ?? req?.header?.("x-company-id");
    const companyId = rawCompanyId === undefined ? null : Number(rawCompanyId);
    await this._handleRequest(res, query, { companyId: Number.isNaN(companyId) ? null : companyId });
  }

  async getAdminServices(req, res) {
    await this.listAdminServices(req, res);
  }
}
