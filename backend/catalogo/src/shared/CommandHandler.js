export class CommandHandler {
  async execute(command) {
    throw new Error(
      "El método 'execute' debe ser implementado en el CommandHandler específico.",
    );
  }
}
