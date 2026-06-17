const express = require("express");
const cors = require("cors");

const { registerHealthRoutes } = require("./src/api/routes/health.routes");
const { registerPublicDebtRoutes } = require("./src/api/routes/public-debts.routes");
const { registerAdminDebtRoutes } = require("./src/api/routes/admin-debts.routes");
const {
  mapAdminDebt,
  mapProvider,
  mapPublicDebt,
} = require("./src/application/mappers/debt-presenters");
const {
  buildDebtPayload,
  isValidDebtStatus,
  isValidPublicIdentifier,
  parseDebtId,
} = require("./src/application/services/debt-payload");
const { parseDebtImportCsv } = require("./src/application/services/debt-import");

function createApp({ prismaClient }) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  registerHealthRoutes(app);
  registerPublicDebtRoutes(app, { prismaClient });
  registerAdminDebtRoutes(app, { prismaClient });

  return app;
}

module.exports = {
  buildDebtPayload,
  createApp,
  mapAdminDebt,
  mapProvider,
  mapPublicDebt,
  parseDebtImportCsv,
  isValidPublicIdentifier,
  isValidDebtStatus,
  parseDebtId,
};
