const express = require('express')
const { PrismaClient } = require('@prisma/client')
const PORT = 3000

if (!process.env.DATABASE_URL) {
    require('dotenv').config();
}

const prisma = new PrismaClient()

const app = express()

app.use(express.json())

app.get('/debts', async (req, res) => {
  const debts = await prisma.debt.findMany()

  res.json(debts)
})

app.listen(PORT, () => {
  console.log('Deudas service running')
})