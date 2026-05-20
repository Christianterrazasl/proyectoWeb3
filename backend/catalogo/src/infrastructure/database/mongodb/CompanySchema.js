import mongoose from "mongoose";

/**
 * Modelo de MongoDB para Empresas.
 * Reflejo de lectura rápida de la tabla original en PostgreSQL.
 */
const CompanySchema = new mongoose.Schema(
  {
    companyId: { type: String, required: true, unique: true }, // Usamos nuestro propio ID de negocio (cmp-XXX), no el _id de Mongo
    name: { type: String, required: true },
    nit: { type: String, required: true, unique: true },
    status: { type: String, required: true },
    logoUrl: { type: String, required: false },
  },
  {
    timestamps: true,
  },
);

export const CompanyModel = mongoose.model("Company", CompanySchema);
