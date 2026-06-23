import { AggregateRoot } from "../../shared/AggregateRoot.js";
import { StringNotNullOrEmptyRule } from "../../shared/rules/StringNotNullOrEmptyRule.js";
import { ValidInputSchemaRule } from "../../shared/rules/ValidInputSchemaRule.js";

export class Service extends AggregateRoot {
  // 1. Constructor privado para rehidratación desde base de datos
  constructor(id, companyId, name, inputSchema, active) {
    super(id);
    this.companyId = companyId;
    this.name = name;
    this.inputSchema = inputSchema;
    this.active = active;
    this.isPublished = active;
  }

  // 2. Factory Method (Única vía legal para crear un servicio nuevo)
  static create(id, companyId, name, inputSchema) {
    AggregateRoot.checkRule(new StringNotNullOrEmptyRule(id, "Service ID"));
    AggregateRoot.checkRule(
      new StringNotNullOrEmptyRule(companyId, "Company ID"),
    );
    AggregateRoot.checkRule(new StringNotNullOrEmptyRule(name, "Service Name"));
    AggregateRoot.checkRule(new ValidInputSchemaRule(inputSchema));

    // Nace activo por defecto
    return new Service(id, companyId, name, inputSchema, true);
  }

  // 3. Comportamientos de Dominio (Mutaciones seguras)
  changeName(newName) {
    AggregateRoot.checkRule(
      new StringNotNullOrEmptyRule(newName, "New Service Name"),
    );
    this.name = newName;
  }

  updateSchema(newSchema) {
    AggregateRoot.checkRule(new ValidInputSchemaRule(newSchema));
    this.inputSchema = newSchema;
  }

  deactivate() {
    this.active = false;
    this.isPublished = false;
  }

  activate() {
    this.active = true;
    this.isPublished = true;
  }
}
