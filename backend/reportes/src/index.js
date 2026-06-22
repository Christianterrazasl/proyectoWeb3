import express from "express";
import systemRoutes from "./api/routes/system.routes.js";
import { createReportRouter } from "./api/routes/report.routes.js";
import { startPaymentCompletedConsumer } from "./infrastructure/messaging/rabbitmq-consumer.js";

export function createApp({ reportRoutesOptions } = {}) {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json());

  app.use("/", systemRoutes);
  app.use("/api", createReportRouter(reportRoutesOptions));
  app.use((_req, res) => {
    res.status(404).json({
      error: "Not Found",
      service: "reportes",
    });
  });

  return app;
}

export async function startServer({ port = process.env.PORT || 3000 } = {}) {
  if (process.env.RABBITMQ_HOST || process.env.RABBITMQ_URL) {
    startPaymentCompletedConsumer().catch((error) => {
      console.error("[reportes] No se pudo iniciar consumer RabbitMQ:", error);
    });
  }

  const app = createApp();

  return app.listen(port, () => {
    console.log(` Servicio de Reportes corriendo en http://localhost:${port}`);
  });
}
