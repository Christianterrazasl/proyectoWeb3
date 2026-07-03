import test from "node:test";
import assert from "node:assert/strict";

import {
  getMeRequest,
  refreshAccessTokenRequest,
  buildAuthenticatedHeaders,
} from "./authApi.js";

test("buildAuthenticatedHeaders keeps Bearer auth and omits empty company scope", () => {
  assert.deepEqual(buildAuthenticatedHeaders("token-1", null), {
    Authorization: "Bearer token-1",
  });
});

test("getMeRequest surfaces unauthorized responses with status metadata", async () => {
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ detail: "Token inválido" }), {
      status: 401,
      headers: {
        "content-type": "application/json",
      },
    });

  await assert.rejects(() => getMeRequest("expired-access"), (error) => {
    assert.equal(error.status, 401);
    assert.match(error.message, /token inválido/i);
    return true;
  });
});

test("refreshAccessTokenRequest exchanges the stored refresh token for a new access token", async () => {
  let requestUrl = null;
  let requestInit = null;

  globalThis.fetch = async (url, init = {}) => {
    requestUrl = url;
    requestInit = init;

    return new Response(JSON.stringify({ access: "fresh-access" }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
    });
  };

  const result = await refreshAccessTokenRequest("refresh-123");

  assert.equal(requestUrl, "/api/auth/refresh/");
  assert.equal(requestInit.method, "POST");
  assert.deepEqual(JSON.parse(requestInit.body), {
    refresh: "refresh-123",
  });
  assert.deepEqual(result, { access: "fresh-access" });
});
