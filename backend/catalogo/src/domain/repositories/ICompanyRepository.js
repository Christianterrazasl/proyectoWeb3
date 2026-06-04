/**
 * Contrato del Repositorio de Empresas.
 * NOTA PARA EL EQUIPO: Aplicamos el Principio de Inversión de Dependencias (SOLID).
 * Los Casos de Uso (Commands/Queries) usarán este contrato conceptual, no la implementación real.
 */
export class ICompanyRepository {
  // === Operaciones de Escritura (Commands) ===
  async save(company) {
    throw new Error("No implementado");
  }
  async update(company) {
    throw new Error("No implementado");
  }

  // === Operaciones de Lectura (Queries) ===
  async findById(id) {
    throw new Error("No implementado");
  }
  async findByNit(nit) {
    throw new Error("No implementado");
  }
  async findAll() {
    throw new Error("No implementado");
  }
}
