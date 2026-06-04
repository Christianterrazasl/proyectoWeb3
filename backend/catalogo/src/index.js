import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeDatabases } from "./infrastructure/database/connection.js";
import catalogRoutes from "./api/routes/catalog.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Configuración de Middlewares Globales
 */
app.use(cors()); // Permitir peticiones desde el frontend (React)
app.use(express.json()); // Habilitar la lectura de JSON en el req.body

/**
 * Montaje del Router Principal
 * Todas las rutas de este microservicio estarán bajo el prefijo /api
 */
app.use("/api", catalogRoutes);

/**
 * Función de inicialización segura (Bootstrap).
 * Garantiza que el servidor no empiece a aceptar peticiones HTTP hasta que
 * PostgreSQL y MongoDB estén 100% listos y conectados.
 */
const startServer = async () => {
  try {
    // 1. Inicializar pool de conexiones a BD
    await initializeDatabases();

    // 2. Levantar el listener HTTP
    app.listen(PORT, () => {
      console.log(
        `🚀 Servidor de Catálogo corriendo en http://localhost:${PORT}`,
      );
      console.log(
        `👉 Prueba POST http://localhost:${PORT}/api/admin/companies`,
      );
      console.log(
        `👉 Prueba GET  http://localhost:${PORT}/api/catalog/services`,
      );
    });
  } catch (error) {
    console.error("❌ Fallo crítico al iniciar la aplicación:", error);
    process.exit(1); // Detener el proceso de Node si hay fallas de infraestructura
  }
};

// Arrancar el servicio
startServer();
