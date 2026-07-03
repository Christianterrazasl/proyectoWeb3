import test from "node:test";
import assert from "node:assert/strict";

import {
  createCatalogService,
  listAdminCompanyCatalogServices,
  listCompanyCatalogServices,
  listProviderCatalogServices,
  syncProviderCatalog,
} from "./catalogApi.js";

test("syncProviderCatalog only syncs the real catalog company record", async () => {
  const calls = [];

  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url, init });

    return new Response(JSON.stringify({ data: { id: 5 } }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
  };

  await syncProviderCatalog("token-1", {
    companyId: 5,
    name: "Empresa Real",
    nit: "NIT-555",
  });

  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, "/api/admin/companies");
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    id: "5",
    name: "Empresa Real",
    nit: "NIT-555",
  });
  assert.equal(calls[1].url, "/api/admin/services");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    id: "empresa-real",
    companyId: 5,
    name: "Empresa Real",
    inputSchema: {
      fields: [
        {
          name: "customerRef",
          type: "string",
          label: "Documento",
          required: true,
        },
      ],
    },
  });
});

test("listCompanyCatalogServices requests company-scoped real services", async () => {
  let requestUrl = null;
  let requestInit = null;

  globalThis.fetch = async (url, init = {}) => {
    requestUrl = url;
    requestInit = init;

    return new Response(JSON.stringify({ data: [{ serviceId: "agua" }] }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
  };

  const result = await listCompanyCatalogServices("token-2", 77);

  assert.equal(requestUrl, "/api/admin/companies/77/services");
  assert.equal(requestInit.headers.Authorization, "Bearer token-2");
  assert.deepEqual(result, [{ serviceId: "agua" }]);
});

test("listProviderCatalogServices requests the active provider company scope explicitly", async () => {
  let requestUrl = null;
  let requestInit = null;

  globalThis.fetch = async (url, init = {}) => {
    requestUrl = url;
    requestInit = init;

    return new Response(JSON.stringify({ data: [{ serviceId: "energia" }] }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
  };

  const result = await listProviderCatalogServices("token-provider", 21);

  assert.equal(requestUrl, "/api/catalog/company/services");
  assert.equal(requestInit.headers.Authorization, "Bearer token-provider");
  assert.equal(requestInit.headers["X-Company-Id"], "21");
  assert.deepEqual(result, [{ serviceId: "energia" }]);
});

test("listAdminCompanyCatalogServices preserves explicit admin company scope", async () => {
  let requestUrl = null;

  globalThis.fetch = async (url) => {
    requestUrl = url;

    return new Response(JSON.stringify({ data: [] }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
  };

  await listAdminCompanyCatalogServices("token-admin", 15);

  assert.equal(requestUrl, "/api/admin/companies/15/services");
});

test("createCatalogService sends only real service data for valid names", async () => {
  let requestBody = null;

  globalThis.fetch = async (_url, init = {}) => {
    requestBody = JSON.parse(init.body);

    return new Response(JSON.stringify({ data: { id: "agua-potable" } }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
  };

  await createCatalogService("token-3", {
    companyId: 9,
    name: "Agua Potable",
  });

  assert.deepEqual(requestBody, {
    id: "agua-potable",
    companyId: 9,
    name: "Agua Potable",
    inputSchema: {
      fields: [
        {
          name: "customerRef",
          type: "string",
          label: "Documento",
          required: true,
        },
      ],
    },
  });
});

test("createCatalogService rejects blank names instead of fabricating fake services", async () => {
  let fetchCalled = false;

  globalThis.fetch = async () => {
    fetchCalled = true;
    throw new Error("fetch should not be called");
  };

  await assert.rejects(
    () =>
      createCatalogService("token-4", {
        companyId: 10,
        name: "   ",
      }),
    /nombre de servicio válido/i,
  );

  assert.equal(fetchCalled, false);
});
