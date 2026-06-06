import express from "express";
import systemRoutes from "./api/routes/system.routes.js";
import { createReportRouter } from "./api/routes/report.routes.js";

export function createApp({ reportRoutesOptions } = {}) {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json());

  // Bootstrap fino: HTTP queda separado del crecimiento futuro de aplicación/dominio.
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

export function startServer({ port = process.env.PORT || 3000 } = {}) {
  const app = createApp();

  return app.listen(port, () => {
    console.log(` Servicio de Reportes corriendo en http://localhost:${port}`);
  });
}
