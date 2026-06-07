const { PrismaClient } = require("@prisma/client");
const { createApp } = require("./app");

if (!process.env.DATABASE_URL) {
  require("dotenv").config();
}

const prisma = new PrismaClient();
const app = createApp({ prismaClient: prisma });
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Deudas service running on port ${PORT}`);
});
