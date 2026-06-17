import test from "node:test";
import assert from "node:assert/strict";

import { CompanyController } from "../../src/api/controllers/CompanyController.js";

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

test("CompanyController delega getAdminServices al query layer con companyId", async () => {
  const calls = [];
  const controller = new CompanyController(
    {},
    {},
    {},
    {
      listAdminServicesQuery: {
        async execute(criteria) {
          calls.push(criteria);
          return [{ serviceId: "srv-10" }];
        },
      },
    },
  );
  const req = {
    companyId: 10,
    header(name) {
      return name.toLowerCase() === "x-company-id" ? "10" : undefined;
    },
  };
  const res = createResponseDouble();

  await controller.getAdminServices(req, res);

  assert.deepEqual(calls, [{ companyId: 10 }]);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.payload, { success: true, data: [{ serviceId: "srv-10" }] });
});

test("CompanyController delega getCatalog al query layer", async () => {
  const controller = new CompanyController(
    {},
    {},
    {},
    {
      getCatalogQuery: {
        async execute() {
          return [{ serviceId: "srv-public" }];
        },
      },
    },
  );
  const res = createResponseDouble();

  await controller.getCatalog({}, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.payload, {
    success: true,
    data: [{ serviceId: "srv-public" }],
  });
});

test("CompanyController responde 404 cuando getServiceById no encuentra datos", async () => {
  const controller = new CompanyController(
    {},
    {},
    {},
    {
      getServiceByIdQuery: {
        async execute() {
          return null;
        },
      },
    },
  );
  const res = createResponseDouble();

  await controller.getServiceById({ params: { id: "srv-missing" } }, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.payload, {
    success: false,
    message: "Servicio no encontrado",
  });
});
