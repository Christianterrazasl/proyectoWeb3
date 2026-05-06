// src/domain/models/Service.ts

/**
 * Estructura del esquema dinámico de entrada.
 * Define qué datos le pediremos al usuario final para poder pagar este servicio.
 */
export interface IInputSchemaField {
  name: string; // ej: "nro_cliente"
  label: string; // ej: "Número de Cliente / Suministro"
  type: "string" | "number" | "boolean";
  required: boolean;
}

/**
 * Entidad de Dominio: Service
 * Representa un servicio específico que una empresa ofrece (ej. "Pago de Luz").
 */
export interface IService {
  id: string; // Formato esperado: srv-001
  companyId: string; // Identificador de la empresa dueña de este servicio
  name: string;
  inputSchema: {
    fields: IInputSchemaField[];
  };
  isActive: boolean;
}

export class Service implements IService {
  constructor(
    public id: string,
    public companyId: string,
    public name: string,
    public inputSchema: { fields: IInputSchemaField[] },
    public isActive: boolean = true,
  ) {}
}
