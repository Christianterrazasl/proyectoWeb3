import { BusinessRule } from "../core/BusinessRule.js";

export class ValidInputSchemaRule extends BusinessRule {
  constructor(schema) {
    super();
    this.schema = schema;
  }

  isValid() {
    if (!this.schema) return false;
    if (!Array.isArray(this.schema.fields)) return false;
    return true;
  }

  message() {
    return "El esquema del servicio (inputSchema) es inválido. Debe contener un array de 'fields'.";
  }
}
