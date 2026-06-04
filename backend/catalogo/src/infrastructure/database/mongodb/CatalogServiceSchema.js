import mongoose from "mongoose";

/**
 * Modelo de MongoDB (Capa de Lectura / CQRS Query)
 * Este documento está "desnormalizado" (aplanado). Contiene datos de la Empresa
 * y del Servicio mezclados.
 * PROPÓSITO: Que el frontend pueda renderizar el catálogo completo con un solo GET super rápido.
 */
const CatalogServiceSchema = new mongoose.Schema({
  serviceId: { type: String, required: true, unique: true },
  companyId: { type: String, required: true },
  companyName: { type: String, required: true }, // Dato duplicado intencionalmente para velocidad de lectura
  serviceName: { type: String, required: true },
  inputSchema: { type: Object, required: true },
});

export const CatalogServiceModel = mongoose.model(
  "CatalogService",
  CatalogServiceSchema,
);
