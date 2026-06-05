const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

if (!process.env.DATABASE_URL) {
  require("dotenv").config();
}

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

function mapProvider(provider) {
  return {
    id: String(provider.id),
    name: provider.name,
    description: provider.description,
    image: provider.image_url,
    idProveedor: provider.tenant_id,
  };
}

app.get("/health", (_req, res) => {
  res.json({ service: "deudas", status: "ok" });
});

app.get("/debts", async (req, res) => {
  try {
    const { customer_ref, tenant_id, status } = req.query;
    const debts = await prisma.debt.findMany({
      where: {
        ...(customer_ref ? { customer_ref: String(customer_ref) } : {}),
        ...(tenant_id ? { tenant_id: String(tenant_id) } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { due_date: "asc" },
    });

    res.json(debts);
  } catch (error) {
    console.error("GET /debts", error);
    res.status(500).json({ message: "No se pudieron obtener las deudas" });
  }
});

app.get("/debts/providers", async (_req, res) => {
  try {
    const providers = await prisma.provider.findMany({
      where: { active: true },
      orderBy: { sort_order: "asc" },
    });

    res.json({
      success: true,
      data: providers.map(mapProvider),
    });
  } catch (error) {
    console.error("GET /debts/providers", error);
    res.status(500).json({
      success: false,
      message: "No se pudo obtener el catálogo de proveedores",
    });
  }
});

app.post("/debts/lookup", async (req, res) => {
  const customerRef = String(req.body?.customerRef || "").trim();
  const serviceId = req.body?.serviceId
    ? String(req.body.serviceId).trim()
    : undefined;

  if (!customerRef) {
    return res.status(400).json({
      success: false,
      message: "El identificador del cliente es obligatorio",
    });
  }

  try {
    const debts = await prisma.debt.findMany({
      where: {
        customer_ref: customerRef,
        status: "PENDING",
        ...(serviceId ? { service_id: serviceId } : {}),
      },
      orderBy: { due_date: "asc" },
    });

    const tenantIds = [...new Set(debts.map((debt) => debt.tenant_id))];

    const providers = await prisma.provider.findMany({
      where: {
        active: true,
        tenant_id: { in: tenantIds },
      },
      orderBy: { sort_order: "asc" },
    });

    res.json({
      success: true,
      data: providers.map(mapProvider),
      meta: {
        customerRef,
        totalProviders: providers.length,
        totalDebts: debts.length,
      },
    });
  } catch (error) {
    console.error("POST /debts/lookup", error);
    res.status(500).json({
      success: false,
      message: "No se pudo realizar la búsqueda de deudas",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Deudas service running on port ${PORT}`);
});
