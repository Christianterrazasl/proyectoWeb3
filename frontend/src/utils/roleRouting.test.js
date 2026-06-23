import test from "node:test";
import assert from "node:assert/strict";

import {
  getDefaultRouteForUser,
  getUserGlobalRole,
  isAdminRole,
  isProviderRole,
} from "./roleRouting.js";

test("getUserGlobalRole lee el rol global desde formas crudas y normalizadas", () => {
  assert.equal(getUserGlobalRole({ global_role: "provider" }), "provider");
  assert.equal(getUserGlobalRole({ user: { global_role: "admin" } }), "admin");
  assert.equal(getUserGlobalRole({ raw: { user: { global_role: "user" } } }), "user");
  assert.equal(getUserGlobalRole({}), null);
});

test("getDefaultRouteForUser enruta cada rol al flujo correcto", () => {
  assert.equal(getDefaultRouteForUser({ global_role: "admin" }), "/admin");
  assert.equal(getDefaultRouteForUser({ global_role: "provider" }), "/proveedor");
  assert.equal(getDefaultRouteForUser({ global_role: "user" }), "/");
  assert.equal(getDefaultRouteForUser({ global_role: "otro" }), "/");
  assert.equal(getDefaultRouteForUser(null), "/");
});

test("los predicados distinguen admin y provider sin mezclar roles", () => {
  const admin = { global_role: "admin" };
  const provider = { global_role: "provider" };
  const user = { global_role: "user" };

  assert.equal(isAdminRole(admin), true);
  assert.equal(isAdminRole(provider), false);
  assert.equal(isProviderRole(provider), true);
  assert.equal(isProviderRole(admin), false);
  assert.equal(isProviderRole(user), false);
});
