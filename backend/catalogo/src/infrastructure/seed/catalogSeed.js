import { AppDataSource, connectMongoDB } from "../database/connection.js";
import { CompanyEntity } from "../database/postgres/CompanyEntity.js";
import { ServiceEntity } from "../database/postgres/ServiceEntity.js";
import { CompanyModel } from "../database/mongodb/CompanySchema.js";
import { CatalogServiceModel } from "../database/mongodb/CatalogServiceSchema.js";

const companies = [
  {
    id: 1,
    name: "Nur",
    nit: "NIT-NUR-001",
    status: "APPROVED",
    active: true,
    logoUrl: "https://placehold.net/1.png",
  },
  {
    id: 2,
    name: "Saguapac",
    nit: "NIT-SAG-002",
    status: "APPROVED",
    active: true,
    logoUrl: "https://placehold.net/2.png",
  },
  {
    id: 3,
    name: "Cre",
    nit: "NIT-CRE-003",
    status: "APPROVED",
    active: true,
    logoUrl: "https://placehold.net/3.png",
  },
  {
    id: 4,
    name: "Colegio Marista",
    nit: "NIT-MAR-004",
    status: "APPROVED",
    active: true,
    logoUrl: "https://placehold.net/4.png",
  },
  {
    id: 6,
    name: "Tigo",
    nit: "NIT-TIGO-006",
    status: "APPROVED",
    active: true,
    logoUrl: "https://placehold.net/6.png",
  },
];

const services = [
  {
    id: "agua-residencial",
    companyId: 1,
    name: "Agua residencial",
    category: "Servicios básicos",
    description: "Pago de agua potable residencial",
    inputSchema: {
      label: "Cédula de identidad",
      type: "text",
      placeholder: "Ej: 1234567",
    },
  },
  {
    id: "agua-comercial",
    companyId: 2,
    name: "Agua comercial",
    category: "Servicios básicos",
    description: "Pago de agua potable comercial",
    inputSchema: {
      label: "Cédula de identidad",
      type: "text",
      placeholder: "Ej: 1234567",
    },
  },
  {
    id: "luz-residencial",
    companyId: 3,
    name: "Luz residencial",
    category: "Energía",
    description: "Pago de energía eléctrica",
    inputSchema: {
      label: "Cédula de identidad",
      type: "text",
      placeholder: "Ej: 7654321",
    },
  },
  {
    id: "colegiatura",
    companyId: 4,
    name: "Colegiatura",
    category: "Educación",
    description: "Pago de colegiatura mensual",
    inputSchema: {
      label: "Código de alumno",
      type: "text",
      placeholder: "Ej: 9876543",
    },
  },
];

async function upsertCompany(companyRepo, company) {
  await companyRepo.save(
    companyRepo.create({
      id: company.id,
      name: company.name,
      nit: company.nit,
      status: company.status,
      active: company.active,
      logoUrl: company.logoUrl,
    }),
  );

  await CompanyModel.findOneAndUpdate(
    { companyId: company.id },
    {
      companyId: company.id,
      name: company.name,
      nit: company.nit,
      status: company.status,
      active: company.active,
      logoUrl: company.logoUrl,
    },
    { upsert: true },
  );
}

async function upsertService(serviceRepo, companyRepo, service) {
  const company = await companyRepo.findOneBy({ id: service.companyId });

  if (!company) {
    throw new Error(`No existe la empresa ${service.companyId} para el servicio ${service.id}`);
  }

  await serviceRepo.save(
    serviceRepo.create({
      id: service.id,
      companyId: service.companyId,
      name: service.name,
      inputSchema: service.inputSchema,
      isPublished: true,
    }),
  );

  await CatalogServiceModel.findOneAndUpdate(
    { serviceId: service.id },
    {
      serviceId: service.id,
      companyId: company.id,
      companyName: company.name,
      companyNit: company.nit,
      companyStatus: company.status,
      companyActive: company.active,
      companyLogoUrl: company.logoUrl,
      serviceName: service.name,
      inputSchema: service.inputSchema,
      isPublished: true,
      category: service.category,
      description: service.description,
    },
    { upsert: true },
  );
}

export async function seedCatalog() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  await connectMongoDB();

  const companyRepo = AppDataSource.getRepository(CompanyEntity);
  const serviceRepo = AppDataSource.getRepository(ServiceEntity);

  for (const company of companies) {
    await upsertCompany(companyRepo, company);
  }

  for (const service of services) {
    await upsertService(serviceRepo, companyRepo, service);
  }

  console.log(
    `Seed catálogo: ${companies.length} empresas y ${services.length} servicios publicados`,
  );
}

const isDirectExecution =
  process.argv[1] && process.argv[1].endsWith("catalogSeed.js");

if (isDirectExecution) {
  seedCatalog()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Seed catálogo falló:", error);
      process.exit(1);
    });
}
