import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAdminExportActions,
  buildAdminDebtImportSuccessMessage,
  buildAdminExportSuccessMessage,
  getAdminEmptyState,
  readAdminDebtImportFile,
} from "./adminClosureModel.js";

test("readAdminDebtImportFile returns the existing backend contract payload", async () => {
  const payload = await readAdminDebtImportFile({
    name: "deudas-junio.csv",
    text: async () => "tenantId,serviceId\n1,agua",
  });

  assert.deepEqual(payload, {
    filename: "deudas-junio.csv",
    csvContent: "tenantId,serviceId\n1,agua",
  });
});

test("readAdminDebtImportFile rejects missing or empty CSV selections", async () => {
  await assert.rejects(
    async () => readAdminDebtImportFile(null),
    /selecciona un archivo csv/i,
  );

  await assert.rejects(
    async () =>
      readAdminDebtImportFile({
        name: "vacio.csv",
        text: async () => "   ",
      }),
    /está vacío/i,
  );
});

test("buildAdminDebtImportSuccessMessage summarizes the completed import", () => {
  assert.equal(
    buildAdminDebtImportSuccessMessage({
      filename: "deudas-junio.csv",
      importedRecords: 2,
      totalRecords: 2,
    }),
    'Importación completada: 2 de 2 registros cargados desde "deudas-junio.csv".',
  );
});

test("getAdminEmptyState gives closure-ready guidance for debts and records", () => {
  assert.equal(
    getAdminEmptyState({
      section: "debts",
      activeCompanyName: "Saguapac",
      debtTab: "pendientes",
    }),
    "No hay deudas pendientes para Saguapac. Importa un CSV o crea una deuda manual para continuar.",
  );

  assert.equal(
    getAdminEmptyState({
      section: "transactions",
      activeCompanyName: "Nur",
    }),
    "Todavía no hay transacciones reales para Nur. Cuando existan pagos, aparecerán aquí.",
  );
});

test("buildAdminExportActions keeps the closure export actions grouped near reporting", () => {
  assert.deepEqual(buildAdminExportActions(), [
    { key: "companies-csv", label: "Empresas CSV", format: "csv", resource: "companies" },
    { key: "companies-xlsx", label: "Empresas XLSX", format: "xlsx", resource: "companies" },
    { key: "services-csv", label: "Servicios CSV", format: "csv", resource: "services" },
    { key: "services-xlsx", label: "Servicios XLSX", format: "xlsx", resource: "services" },
    { key: "transactions-csv", label: "Transacciones CSV", format: "csv", resource: "transactions" },
    { key: "transactions-xlsx", label: "Transacciones XLSX", format: "xlsx", resource: "transactions" },
  ]);
});

test("buildAdminExportSuccessMessage confirms the real file and active company scope", () => {
  assert.equal(
    buildAdminExportSuccessMessage({
      filename: "companies-report.csv",
      activeCompanyName: "Saguapac",
    }),
    'Descarga iniciada: "companies-report.csv" para Saguapac.',
  );
});
