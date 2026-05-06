// src/infrastructure/database/mongodb/CatalogServiceSchema.ts
import mongoose, { Schema, Document } from "mongoose";

/**
 * Modelo de MongoDB (Capa de Lectura / CQRS Query)
 * Este documento está "desnormalizado" (aplanado). Contiene datos de la Empresa
 * y del Servicio mezclados.
 * PROPÓSITO: Que el frontend pueda renderizar el catálogo completo con un solo GET super rápido.
 */
export interface ICatalogServiceMongo extends Document {
  serviceId: string;
  companyId: string;
  companyName: string; // Dato duplicado intencionalmente para velocidad de lectura
  serviceName: string;
  inputSchema: any;
}

const CatalogServiceSchema: Schema = new Schema({
  serviceId: { type: String, required: true, unique: true },
  companyId: { type: String, required: true },
  companyName: { type: String, required: true },
  serviceName: { type: String, required: true },
  inputSchema: { type: Object, required: true },
});

export const CatalogServiceModel = mongoose.model<ICatalogServiceMongo>(
  "CatalogService",
  CatalogServiceSchema,
);
