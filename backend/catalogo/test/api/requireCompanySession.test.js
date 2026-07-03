import test from "node:test";
import assert from "node:assert/strict";

import { createRequireCompanySession } from "../../src/api/middleware/requireCompanySession.js";

function createResponseDouble() {
  return {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

test("requireCompanySession scopea a providers a su company activa aunque envíen otro header", async () => {
  const middleware = createRequireCompanySession({
    fetchCurrentSessionFn: async () => ({
      ok: true,
      status: 200,
      body: {
        user: { global_role: "provider" },
        active_company_id: 7,
      },
    }),
  });
  const req = {
    header(name) {
      const headers = {
        authorization: "Bearer token-provider",
        "x-company-id": "99",
      };

      return headers[name.toLowerCase()];
    },
  };
  const res = createResponseDouble();
  let nextCalled = false;

  await middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.companyId, 7);
  assert.equal(req.authContext.active_company_id, 7);
});

test("requireCompanySession rechaza sesiones sin empresa activa", async () => {
  const middleware = createRequireCompanySession({
    fetchCurrentSessionFn: async () => ({
      ok: true,
      status: 200,
      body: {
        user: { global_role: "provider" },
        active_company_id: null,
      },
    }),
  });
  const req = {
    header(name) {
      return name.toLowerCase() === "authorization" ? "Bearer token-provider" : undefined;
    },
  };
  const res = createResponseDouble();

  await middleware(req, res, () => {
    throw new Error("next should not be called");
  });

  assert.equal(res.statusCode, 403);
  assert.match(res.payload.message, /empresa activa/i);
});
