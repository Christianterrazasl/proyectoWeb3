export class BusinessRule {
  isValid() {
    throw new Error(
      "El método 'isValid' debe ser implementado por la regla específica.",
    );
  }
  message() {
    throw new Error(
      "El método 'message' debe ser implementado por la regla específica.",
    );
  }
}
