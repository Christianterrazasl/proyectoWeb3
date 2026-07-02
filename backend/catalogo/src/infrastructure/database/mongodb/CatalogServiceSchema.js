import mongoose from "mongoose";

/**
 * Modelo de MongoDB (Capa de Lectura / CQRS Query)
 * Este documento está "desnormalizado" (aplanado). Contiene datos de la Empresa
 * y del Servicio mezclados.
 * PROPÓSITO: Que el frontend pueda renderizar el catálogo completo con un solo GET super rápido.
 */
const CatalogServiceSchema = new mongoose.Schema({
  serviceId: { type: String, required: true, unique: true },
  companyId: { type: Number, required: true },
  companyName: { type: String, required: true }, // Dato duplicado intencionalmente para velocidad de lectura
  companyNit: { type: String, required: true },
  companyStatus: { type: String, required: true },
  companyActive: { type: Boolean, required: true },
  companyLogoUrl: { type: String, required: false },
  serviceName: { type: String, required: true },
  category: { type: String, required: false },
  description: { type: String, required: false },
  inputSchema: { type: Object, required: true },
  isPublished: { type: Boolean, required: true, default: true },
});

export const CatalogServiceModel = mongoose.model(
  "CatalogService",
  CatalogServiceSchema,
);
