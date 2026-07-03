const test = require("node:test");
const assert = require("node:assert/strict");

const {
  rewriteAdminCompaniesPath,
  rewriteAdminServicesPath,
} = require("./proxyConfig");

test("rewriteAdminCompaniesPath conserva el sufijo company/services", () => {
  assert.equal(
    rewriteAdminCompaniesPath("/1/services"),
    "/api/companies/1/services",
  );
});

test("rewriteAdminServicesPath reescribe el listado admin al contrato runtime", () => {
  assert.equal(rewriteAdminServicesPath("/"), "/api/services/");
});
