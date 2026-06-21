import { BusinessRule } from "../core/BusinessRule.js";

export class StringNotNullOrEmptyRule extends BusinessRule {
  constructor(value, fieldName) {
    super();
    this.value = value;
    this.fieldName = fieldName;
  }

  isValid() {
    return (
      this.value !== null &&
      this.value !== undefined &&
      this.value.trim() !== ""
    );
  }

  message() {
    return `El campo '${this.fieldName}' no puede ser nulo ni estar vacío.`;
  }
}
