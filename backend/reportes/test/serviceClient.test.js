import test from "node:test";
import assert from "node:assert/strict";

import { createServiceClient } from "../src/infrastructure/catalog/serviceClient.js";

test("createServiceClient usa el endpoint runtime de catálogo para servicios scoped", async () => {
  let capturedUrl = null;
  let capturedOptions = null;

  const client = createServiceClient({
    fetchImpl: async (url, options) => {
      capturedUrl = url;
      capturedOptions = options;

      return {
        ok: true,
        status: 200,
        json: async () => ({ data: [] }),
      };
    },
  });

  const result = await client({
    authorization: "Bearer report-token",
    companyId: 42,
  });

  assert.equal(result.ok, true);
  assert.equal(capturedUrl, "http://catalogo:3000/api/services");
  assert.deepEqual(capturedOptions, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer report-token",
      "X-Company-Id": "42",
    },
  });
});

test("createServiceClient omite X-Company-Id cuando el dashboard es global", async () => {
  let capturedOptions = null;

  const client = createServiceClient({
    fetchImpl: async (_url, options) => {
      capturedOptions = options;

      return {
        ok: true,
        status: 200,
        json: async () => ({ data: [] }),
      };
    },
  });

  await client({
    authorization: "Bearer report-token",
    companyId: null,
  });

  assert.equal("X-Company-Id" in capturedOptions.headers, false);
});
