export class QueryHandler {
  async execute() {
    throw new Error(
      "El método 'execute' debe ser implementado en el QueryHandler específico.",
    );
  }
}
