import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPublicCatalogBrowserState,
  buildPublicCatalogGuidance,
  buildPublicLookupPanelModel,
  buildPublicResultsSummary,
  buildPublicServiceOptions,
  buildSelectedCompanyHeroModel,
} from "./publicFlowViewModels.js";

test("buildPublicCatalogBrowserState prioritizes the loading state while the catalog is pending", () => {
  const state = buildPublicCatalogBrowserState({
    loadingCatalog: true,
    catalogError: "fallo de red",
    filteredCompanies: [{ id: "cmp-1" }],
  });

  assert.equal(state.matchCountLabel, "1 coincidencia(s)");
  assert.deepEqual(state.contentState, {
    variant: "loading",
    title: "Cargando empresas disponibles",
    description:
      "Estamos consultando el catálogo público actual para mostrarte las empresas y servicios habilitados.",
  });
});

test("buildPublicCatalogBrowserState surfaces the catalog error when loading already finished", () => {
  const state = buildPublicCatalogBrowserState({
    loadingCatalog: false,
    catalogError: "No autorizado",
    filteredCompanies: [{ id: "cmp-1" }, { id: "cmp-2" }],
  });

  assert.equal(state.matchCountLabel, "2 coincidencia(s)");
  assert.deepEqual(state.contentState, {
    variant: "error",
    title: "No se pudo cargar el catálogo público",
    description: "No autorizado",
  });
});

test("buildPublicCatalogBrowserState reports an empty state when no company matches the filters", () => {
  const state = buildPublicCatalogBrowserState({
    loadingCatalog: false,
    catalogError: "",
    filteredCompanies: [],
  });

  assert.equal(state.matchCountLabel, "0 coincidencia(s)");
  assert.deepEqual(state.contentState, {
    variant: "empty",
    title: "No encontramos coincidencias",
    description:
      "Prueba con otro nombre, servicio o categoría para continuar con la consulta pública.",
  });
});

test("buildPublicCatalogBrowserState returns no content state when the browser should show the company grid", () => {
  const state = buildPublicCatalogBrowserState({
    loadingCatalog: false,
    catalogError: "",
    filteredCompanies: [{ id: "cmp-1" }],
  });

  assert.equal(state.matchCountLabel, "1 coincidencia(s)");
  assert.equal(state.contentState, null);
});

test("buildPublicCatalogGuidance explains how many companies remain after applying category and text filters", () => {
  const guidance = buildPublicCatalogGuidance({
    totalCompanies: 12,
    totalServices: 28,
    filteredCompanies: [
      { id: "cmp-1", services: [{ id: "svc-1" }, { id: "svc-2" }] },
      { id: "cmp-2", services: [{ id: "svc-3" }] },
    ],
    activeCategory: "Agua",
    searchTerm: "norte",
  });

  assert.equal(guidance.title, "Explora 2 empresas filtradas");
  assert.equal(
    guidance.description,
    'Categoria activa: Agua. Busqueda actual: "norte". Revisa las opciones disponibles y elige una empresa para continuar con sus servicios.',
  );
  assert.equal(guidance.matchCountLabel, "2 empresas / 3 servicios visibles");
  assert.deepEqual(guidance.badges, ["12 empresas en catálogo", "28 servicios publicados"]);
});

test("buildPublicCatalogGuidance falls back to the full catalog guidance when there are no active filters", () => {
  const guidance = buildPublicCatalogGuidance({
    totalCompanies: 4,
    totalServices: 9,
    filteredCompanies: [
      { id: "cmp-1", services: [{ id: "svc-1" }] },
      { id: "cmp-2", services: [{ id: "svc-2" }] },
      { id: "cmp-3", services: [{ id: "svc-3" }] },
      { id: "cmp-4", services: [{ id: "svc-4" }] },
    ],
    activeCategory: "__all__",
    searchTerm: "   ",
  });

  assert.equal(guidance.title, "Explora el catálogo público completo");
  assert.equal(
    guidance.description,
    "Comienza por la empresa que deseas consultar. Luego podrás elegir el servicio y escribir la referencia exacta del cliente.",
  );
  assert.equal(guidance.matchCountLabel, "4 empresas / 4 servicios visibles");
});

test("buildSelectedCompanyHeroModel preserves selected company copy when provided", () => {
  const model = buildSelectedCompanyHeroModel({
    category: "Energía",
    companyName: "Electro Norte",
    description: "Consulta y paga tus facturas activas.",
    servicesCount: 3,
  });

  assert.deepEqual(model, {
    categoryLabel: "Energía",
    companyName: "Electro Norte",
    description: "Consulta y paga tus facturas activas.",
    stats: [
      { key: "company", label: "Empresa", value: "Electro Norte" },
      { key: "services", label: "Servicios", value: 3 },
    ],
  });
});

test("buildSelectedCompanyHeroModel applies public catalog fallbacks when copy is missing", () => {
  const model = buildSelectedCompanyHeroModel({
    category: "",
    companyName: "Aguas del Sur",
    description: "",
    servicesCount: 1,
  });

  assert.equal(model.categoryLabel, "Catálogo público");
  assert.equal(
    model.description,
    "Selecciona el servicio que corresponda y luego ingresa la referencia del cliente para consultar las deudas disponibles.",
  );
  assert.deepEqual(model.stats[1], {
    key: "services",
    label: "Servicios",
    value: 1,
  });
});

test("buildPublicServiceOptions marks the selected service and keeps its provided copy", () => {
  const options = buildPublicServiceOptions({
    companyName: "Electro Norte",
    services: [
      {
        id: "water",
        name: "Agua",
        description: "Consulta pública del suministro de agua.",
      },
      {
        id: "power",
        name: "Luz",
        description: "Consulta pública del suministro eléctrico.",
      },
    ],
    selectedServiceId: "power",
  });

  assert.equal(options.length, 2);
  assert.deepEqual(options[0], {
    id: "water",
    companyName: "Electro Norte",
    name: "Agua",
    description: "Consulta pública del suministro de agua.",
    selected: false,
    statusLabel: "Disponible",
    nextStepLabel: "Haz clic para consultar este servicio",
  });
  assert.equal(options[1].selected, true);
});

test("buildPublicServiceOptions falls back to the catalog copy when a service description is missing", () => {
  const options = buildPublicServiceOptions({
    companyName: "Aguas del Sur",
    services: [{ id: "ref", name: "Referencia", description: "" }],
    selectedServiceId: "missing",
  });

  assert.deepEqual(options, [
    {
      id: "ref",
      companyName: "Aguas del Sur",
      name: "Referencia",
      description:
        "Este servicio está disponible para consulta pública dentro del catálogo actual.",
      selected: false,
      statusLabel: "Disponible",
      nextStepLabel: "Haz clic para consultar este servicio",
    },
  ]);
});

test("buildPublicServiceOptions highlights the selected service and explains the next step", () => {
  const options = buildPublicServiceOptions({
    companyName: "Electro Norte",
    services: [
      { id: "power", name: "Luz", description: "Servicio principal" },
      { id: "gas", name: "Gas", description: "Servicio secundario" },
    ],
    selectedServiceId: "power",
  });

  assert.deepEqual(options[0], {
    id: "power",
    companyName: "Electro Norte",
    name: "Luz",
    description: "Servicio principal",
    selected: true,
    statusLabel: "Seleccionado",
    nextStepLabel: "Siguiente: escribe la referencia para consultar deudas",
  });
  assert.equal(options[1].statusLabel, "Disponible");
});

test("buildPublicLookupPanelModel explains readiness before and after the customer reference is complete", () => {
  const disabledModel = buildPublicLookupPanelModel({
    selectedServiceName: "Agua Hogar",
    inputLabel: "Número de contrato",
    normalizedCustomerRef: "",
    canSearch: false,
    selectedServiceEnabled: true,
  });

  assert.equal(disabledModel.statusTone, "pending");
  assert.equal(
    disabledModel.helperText,
    "Usa el mismo Número de contrato registrado por la empresa para habilitar la consulta.",
  );
  assert.equal(
    disabledModel.readinessLabel,
    "Completa la referencia para consultar Agua Hogar.",
  );

  const readyModel = buildPublicLookupPanelModel({
    selectedServiceName: "Agua Hogar",
    inputLabel: "Número de contrato",
    normalizedCustomerRef: "123456",
    canSearch: true,
    selectedServiceEnabled: true,
  });

  assert.equal(readyModel.statusTone, "ready");
  assert.equal(
    readyModel.readinessLabel,
    "Referencia lista. Ya puedes consultar Agua Hogar.",
  );
});

test("buildPublicLookupPanelModel blocks the form copy when no service has been selected", () => {
  const model = buildPublicLookupPanelModel({
    selectedServiceName: "",
    inputLabel: "Referencia del cliente",
    normalizedCustomerRef: "ABC",
    canSearch: false,
    selectedServiceEnabled: false,
  });

  assert.equal(model.statusTone, "disabled");
  assert.equal(
    model.readinessLabel,
    "Selecciona un servicio para habilitar el campo y la búsqueda.",
  );
});

test("buildPublicResultsSummary aggregates debt context for successful lookups with pending balances", () => {
  const summary = buildPublicResultsSummary({
    debts: [
      { amount: 10.5, period: "2026-01" },
      { amount: 4.25, period: "2026-02" },
    ],
    selectedServiceName: "Agua Hogar",
    companyName: "Aguas del Sur",
    customerRef: "REF-88",
  });

  assert.equal(summary.title, "Encontramos 2 deudas pendientes");
  assert.equal(
    summary.description,
    "Valida empresa, referencia y periodos antes de pasar al detalle de deudas y al pago QR.",
  );
  assert.equal(summary.totalAmountLabel, "Bs. 14.75");
  assert.equal(summary.detailItems[0].value, "Aguas del Sur");
  assert.equal(summary.detailItems[1].value, "Agua Hogar");
  assert.equal(summary.detailItems[2].value, "REF-88");
  assert.equal(summary.detailItems[3].value, "2026-01 a 2026-02");
});

test("buildPublicResultsSummary returns a stable empty summary when there are no debts", () => {
  const summary = buildPublicResultsSummary({
    debts: [],
    selectedServiceName: "Agua Hogar",
    companyName: "Aguas del Sur",
    customerRef: "REF-88",
  });

  assert.equal(summary, null);
});
