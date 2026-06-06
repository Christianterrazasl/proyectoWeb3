import { DataSource } from "typeorm";
import mongoose from "mongoose";
import { CompanyEntity } from "./postgres/CompanyEntity.js";
import { ServiceEntity } from "./postgres/ServiceEntity.js";
import dotenv from "dotenv";

dotenv.config();

// 1. Configuración de PostgreSQL (Escritura)
export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.POSTGRES_URI,
  synchronize: true, // ¡Ojo! Solo para desarrollo. Crea las tablas automáticamente.
  logging: false,
  entities: [CompanyEntity, ServiceEntity], // Registramos nuestras tablas
});

// 2. Función para conectar a MongoDB (Lectura)
export const connectMongoDB = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI || "mongodb://localhost:27017/multipagos_db";
    await mongoose.connect(mongoUri);
    console.log(" Conectado a MongoDB (Lectura)");
  } catch (error) {
    console.error("Error conectando a MongoDB:", error);
    process.exit(1);
  }
};

// 3. Función para inicializar ambas
export const initializeDatabases = async () => {
  try {
    await AppDataSource.initialize();
    console.log("Conectado a PostgreSQL (Escritura)");
    await connectMongoDB();
  } catch (error) {
    console.error("Error inicializando bases de datos:", error);
    process.exit(1);
  }
};
