/**
 * Contrato del Repositorio de Servicios.
 */
export class IServiceRepository {
  async save(service) {
    throw new Error("No implementado");
  }
  async findByCompanyId(companyId) {
    throw new Error("No implementado");
  }
}
