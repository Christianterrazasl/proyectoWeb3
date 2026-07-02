import assert from "node:assert/strict";
import test from "node:test";

import {
  PUBLIC_ALL_CATEGORIES,
  buildCompanyDirectory,
  buildLookupFieldConfig,
  buildPublicPaymentRoute,
  deriveCompanyCategories,
  filterCompaniesByCategoryAndQuery,
  normalizeCatalogText,
} from "./publicCatalogFlow.js";

test("normalizeCatalogText lowercases values and removes accents", () => {
  assert.equal(normalizeCatalogText(" Energía Ágil "), " energia agil ");
  assert.equal(normalizeCatalogText(null), "");
});

test("buildCompanyDirectory groups services by company and sorts the catalog by name", () => {
  const companies = buildCompanyDirectory([
    {
      id: "svc-2",
      name: "Factura",
      companyId: "cmp-b",
      companyName: "Banco Solar",
      category: "Finanzas",
      description: "Pagos bancarios.",
      logoUrl: "bank.svg",
    },
    {
      id: "svc-1",
      name: "Medidor",
      companyId: "cmp-a",
      companyName: "Águas del Sur",
      category: "Agua",
      description: "Consulta de agua.",
      logoUrl: "water.svg",
    },
    {
      id: "svc-3",
      name: "Historial",
      companyId: "cmp-a",
      companyName: "Águas del Sur",
      category: "",
      description: "",
      logoUrl: "",
    },
  ]);

  assert.equal(companies.length, 2);
  assert.equal(companies[0].name, "Águas del Sur");
  assert.equal(companies[0].services.length, 2);
  assert.equal(companies[0].category, "Agua");
  assert.equal(companies[0].description, "Consulta de agua.");
  assert.equal(companies[1].name, "Banco Solar");
});

test("deriveCompanyCategories keeps unique non-empty categories sorted in Spanish order", () => {
  const categories = deriveCompanyCategories([
    { category: "Telefonía" },
    { category: "Agua" },
    { category: "" },
    { category: "Agua" },
  ]);

  assert.deepEqual(categories, ["Agua", "Telefonía"]);
});

test("filterCompaniesByCategoryAndQuery matches category and service text using normalized search", () => {
  const companies = [
    {
      id: "cmp-a",
      name: "Águas del Sur",
      category: "Agua",
      description: "Facturas del hogar",
      services: [{ name: "Consulta residencial" }],
    },
    {
      id: "cmp-b",
      name: "Telefonía Centro",
      category: "Telefonía",
      description: "Recargas y facturas",
      services: [{ name: "Plan móvil" }],
    },
  ];

  assert.deepEqual(
    filterCompaniesByCategoryAndQuery({
      companies,
      activeCategory: PUBLIC_ALL_CATEGORIES,
      searchTerm: "AGUAS",
    }).map((company) => company.id),
    ["cmp-a"],
  );

  assert.deepEqual(
    filterCompaniesByCategoryAndQuery({
      companies,
      activeCategory: "Telefonía",
      searchTerm: "movil",
    }).map((company) => company.id),
    ["cmp-b"],
  );
});

test("buildPublicPaymentRoute encodes company and customer reference only when both exist", () => {
  assert.equal(
    buildPublicPaymentRoute({
      selectedService: { companyId: "cmp 1" },
      customerRef: "REF 123",
    }),
    "/deuda/cmp%201?customerRef=REF%20123",
  );

  assert.equal(
    buildPublicPaymentRoute({
      selectedService: { companyId: "cmp-1" },
      customerRef: "   ",
    }),
    "",
  );
});

test("buildLookupFieldConfig applies schema defaults when catalog metadata is incomplete", () => {
  assert.deepEqual(buildLookupFieldConfig(null), {
    inputLabel: "Referencia del cliente",
    inputType: "text",
    inputPlaceholder: "Ej: Ingrese su referencia del cliente",
  });

  assert.deepEqual(
    buildLookupFieldConfig({
      inputSchema: {
        title: "Número de contrato",
        type: "number",
        placeholder: "Ingresa tu contrato",
      },
    }),
    {
      inputLabel: "Número de contrato",
      inputType: "number",
      inputPlaceholder: "Ingresa tu contrato",
    },
  );
});
