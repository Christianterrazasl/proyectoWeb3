import mongoose from "mongoose";

/**
 * Modelo de MongoDB para Empresas.
 * Reflejo de lectura rápida de la tabla original en PostgreSQL.
 */
const CompanySchema = new mongoose.Schema(
  {
    companyId: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    nit: { type: String, required: true, unique: true },
    status: { type: String, required: true },
    active: { type: Boolean, required: true, default: true },
    logoUrl: { type: String, required: false },
  },
  {
    timestamps: true,
  },
);

export const CompanyModel = mongoose.model("Company", CompanySchema);
