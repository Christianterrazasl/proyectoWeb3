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

test("requireCompanySession valida con auth la company solicitada y usa solo la resuelta", async () => {
  const sessionCalls = [];
  const middleware = createRequireCompanySession({
    fetchCurrentSessionFn: async ({ authorization, companyId }) => {
      sessionCalls.push({ authorization, companyId });

      return {
        ok: true,
        status: 200,
        body: {
          user: { global_role: "provider" },
          active_company_id: 7,
        },
      };
    },
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
  assert.deepEqual(sessionCalls, [
    {
      authorization: "Bearer token-provider",
      companyId: 99,
    },
  ]);
  assert.equal(req.companyId, 7);
  assert.equal(req.authContext.active_company_id, 7);
});

test("requireCompanySession rechaza la company no asignada cuando auth niega el cambio", async () => {
  const middleware = createRequireCompanySession({
    fetchCurrentSessionFn: async ({ companyId }) => ({
      ok: false,
      status: 403,
      body: {
        detail:
          companyId === 88
            ? "You do not have access to this tenant"
            : "unexpected company",
      },
    }),
  });
  const req = {
    header(name) {
      const headers = {
        authorization: "Bearer token-provider",
        "x-company-id": "88",
      };

      return headers[name.toLowerCase()];
    },
  };
  const res = createResponseDouble();

  await middleware(req, res, () => {
    throw new Error("next should not be called");
  });

  assert.equal(res.statusCode, 403);
  assert.match(res.payload.message, /access to this tenant/i);
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
