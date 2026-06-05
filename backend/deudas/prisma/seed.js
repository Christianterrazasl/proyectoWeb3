const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const providers = [
  {
    tenant_id: "1",
    name: "Nur",
    description: "Pago de servicios",
    image_url: "https://placehold.net/1.png",
    sort_order: 1,
  },
  {
    tenant_id: "2",
    name: "Saguapac",
    description: "Pago de servicios",
    image_url: "https://placehold.net/2.png",
    sort_order: 2,
  },
  {
    tenant_id: "3",
    name: "Cre",
    description: "Pago de servicios",
    image_url: "https://placehold.net/3.png",
    sort_order: 3,
  },
  {
    tenant_id: "4",
    name: "Colegio Marista",
    description: "Pago de servicios",
    image_url: "https://placehold.net/4.png",
    sort_order: 4,
  },
  {
    tenant_id: "6",
    name: "Tigo",
    description: "Pago de servicios",
    image_url: "https://placehold.net/6.png",
    sort_order: 5,
  },
];

const debts = [
  {
    tenant_id: "1",
    service_id: "agua-residencial",
    customer_ref: "1234567",
    period: "2026-03",
    amount: 85.5,
    due_date: new Date("2026-04-15"),
    status: "PENDING",
  },
  {
    tenant_id: "2",
    service_id: "agua-comercial",
    customer_ref: "1234567",
    period: "2026-03",
    amount: 120,
    due_date: new Date("2026-04-10"),
    status: "PENDING",
  },
  {
    tenant_id: "3",
    service_id: "luz-residencial",
    customer_ref: "7654321",
    period: "2026-02",
    amount: 200,
    due_date: new Date("2026-03-20"),
    status: "PENDING",
  },
  {
    tenant_id: "4",
    service_id: "colegiatura",
    customer_ref: "9876543",
    period: "2026-01",
    amount: 450,
    due_date: new Date("2026-02-28"),
    status: "PAID",
  },
];

async function main() {
  for (const provider of providers) {
    await prisma.provider.upsert({
      where: { tenant_id: provider.tenant_id },
      update: provider,
      create: provider,
    });
  }

  const debtCount = await prisma.debt.count();
  if (debtCount === 0) {
    await prisma.debt.createMany({ data: debts });
  }

  console.log("Seed deudas: proveedores y deudas de prueba cargados");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
