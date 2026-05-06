// src/infrastructure/database/mongodb/CompanySchema.ts
import mongoose, { Schema, Document } from "mongoose";

/**
 * Modelo de MongoDB para Empresas.
 * Reflejo de lectura rápida de la tabla original en PostgreSQL.
 */
export interface ICompanyMongo extends Document {
  companyId: string; // Usamos nuestro propio ID de negocio (cmp-XXX), no el _id de Mongo
  name: string;
  nit: string;
  status: string;
  logoUrl?: string;
}

const CompanySchema: Schema = new Schema(
  {
    companyId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    nit: { type: String, required: true, unique: true },
    status: { type: String, required: true },
    logoUrl: { type: String, required: false },
  },
  {
    timestamps: true,
  },
);

export const CompanyModel = mongoose.model<ICompanyMongo>(
  "Company",
  CompanySchema,
);
