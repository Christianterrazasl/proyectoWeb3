import { CreateCompanyCommand } from "../../application/commands/CreateCompanyCommand.js";
import { UpdateCompanyCommand } from "../../application/commands/UpdateCompanyCommand.js";
import { CreateServiceCommand } from "../../application/commands/CreateServiceCommand.js";
import { UpdateServiceCommand } from "../../application/commands/UpdateServiceCommand.js";
import { GetCatalogQuery } from "../../application/queries/GetCatalogQuery.js";
import { GetServiceByIdQuery } from "../../application/queries/GetServiceByIdQuery.js";
import { GetCompanyServicesQuery } from "../../application/queries/GetCompanyServicesQuery.js";
import { ListAdminServicesQuery } from "../../application/queries/ListAdminServicesQuery.js";

export class CompanyController {
  constructor(companyRepository, serviceRepository) {
    this.companyRepository = companyRepository;
    this.serviceRepository = serviceRepository;
  }

  async _handleRequest(res, handler, ...args) {
    try {
      const result = await handler.execute(...args);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

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
    const payload = { ...req.body };

    if (req.user && req.user.global_role === "COMPANY_ADMIN") {
      payload.companyId = req.user.tenant_id;
    }

    await this._handleRequest(res, command, payload);
  }

  async updateService(req, res) {
    const command = new UpdateServiceCommand(this.serviceRepository);
    await this._handleRequest(res, command, req.params.id, req.body);
  }

  async getPublicCatalog(req, res) {
    const query = new GetCatalogQuery(
      this.serviceRepository,
      this.companyRepository,
    );
    await this._handleRequest(res, query);
  }

  async getServiceById(req, res) {
    const query = new GetServiceByIdQuery(this.serviceRepository);
    await this._handleRequest(res, query, req.params.id);
  }

  async getCompanyServices(req, res) {
    let companyId = req.params.companyId ?? req.companyId;
    if (req.user && req.user.global_role === "COMPANY_ADMIN") {
      companyId = req.user.tenant_id;
    }
    const query = new GetCompanyServicesQuery(this.serviceRepository);
    await this._handleRequest(res, query, companyId);
  }

  async listAdminServices(req, res) {
    const query = new ListAdminServicesQuery(this.serviceRepository);
    let tenantId = null;
    if (req.user && req.user.global_role === "COMPANY_ADMIN") {
      tenantId = req.user.tenant_id;
    }
    await this._handleRequest(res, query, tenantId);
  }
}
