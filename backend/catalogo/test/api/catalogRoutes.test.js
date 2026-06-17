import test from "node:test";
import assert from "node:assert/strict";

import router from "../../src/api/routes/catalog.routes.js";

function collectRoutes(expressRouter) {
  return expressRouter.stack
    .filter((layer) => layer.route)
    .map((layer) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods).sort(),
    }));
}

test("catalog.routes carga y expone las rutas esperadas", () => {
  const routes = collectRoutes(router);

  assert.deepEqual(routes, [
    { path: "/admin/services", methods: ["post"] },
    { path: "/admin/services", methods: ["get"] },
    { path: "/catalog/services", methods: ["get"] },
    { path: "/companies/:id", methods: ["put"] },
    { path: "/services/:id", methods: ["put"] },
    { path: "/companies/:companyId/services", methods: ["get"] },
    { path: "/services/:id", methods: ["get"] },
  ]);
});
