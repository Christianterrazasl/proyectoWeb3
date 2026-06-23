const { PrismaClient } = require("@prisma/client");
const { createApp } = require("./app");
const { startPaymentCompletedConsumer } = require("./src/infrastructure/messaging/rabbitmq-consumer");

if (!process.env.DATABASE_URL) {
  require("dotenv").config();
}

const prisma = new PrismaClient();
const app = createApp({ prismaClient: prisma });
const PORT = process.env.PORT || 3000;

async function bootstrap() {
  startPaymentCompletedConsumer(prisma).catch((error) => {
    console.error("[deudas] No se pudo iniciar el consumer RabbitMQ:", error);
  });

  app.listen(PORT, () => {
    console.log(`Deudas service running on port ${PORT}`);
  });
}

bootstrap();
