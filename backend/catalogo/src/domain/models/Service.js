/**
 * Estructura del esquema dinámico de entrada (Referencia para el equipo).
 * Define qué datos le pediremos al usuario final para poder pagar este servicio.
 * Ej: { name: "nro_cliente", label: "Número de Cliente", type: "string", required: true }
 * * Entidad de Dominio: Service
 * Representa un servicio específico que una empresa ofrece (ej. "Pago de Luz").
 */
export class Service {
  constructor(id, companyId, name, inputSchema, isPublished = true) {
    this.id = id;
    this.companyId = companyId;
    this.name = name;
    this.inputSchema = inputSchema;
    this.isPublished = isPublished;
  }
}
