import test from "node:test";
import assert from "node:assert/strict";

import { ListAdminServicesQuery } from "../../../src/application/queries/ListAdminServicesQuery.js";
import { GetCatalogQuery } from "../../../src/application/queries/GetCatalogQuery.js";
import { GetCompanyServicesQuery } from "../../../src/application/queries/GetCompanyServicesQuery.js";
import { GetServiceByIdQuery } from "../../../src/application/queries/GetServiceByIdQuery.js";

test("ListAdminServicesQuery usa findAll cuando no hay companyId", async () => {
  let called = "";
  const repository = {
    async findAll() {
      called = "findAll";
      return [{ serviceId: "srv-1" }];
    },
    async findByCompanyId() {
      throw new Error("no debe llamarse");
    },
  };

  const query = new ListAdminServicesQuery(repository);
  const result = await query.execute({ companyId: null });

  assert.equal(called, "findAll");
  assert.deepEqual(result, [{ serviceId: "srv-1" }]);
});

test("ListAdminServicesQuery usa findByCompanyId cuando recibe companyId", async () => {
  let receivedCompanyId;
  const repository = {
    async findAll() {
      throw new Error("no debe llamarse");
    },
    async findByCompanyId(companyId) {
      receivedCompanyId = companyId;
      return [{ serviceId: "srv-2", companyId }];
    },
  };

  const query = new ListAdminServicesQuery(repository);
  const result = await query.execute({ companyId: 7 });

  assert.equal(receivedCompanyId, 7);
  assert.deepEqual(result, [{ serviceId: "srv-2", companyId: 7 }]);
});

test("GetCatalogQuery obtiene el catálogo desde el repositorio de lectura", async () => {
  const repository = {
    async findAll() {
      return [{ serviceId: "srv-3", public: true }];
    },
  };

  const query = new GetCatalogQuery(repository);
  const result = await query.execute();

  assert.deepEqual(result, [{ serviceId: "srv-3", public: true }]);
});

test("GetCompanyServicesQuery obtiene servicios por empresa", async () => {
  let receivedCompanyId;
  const repository = {
    async findByCompanyId(companyId) {
      receivedCompanyId = companyId;
      return [{ serviceId: "srv-4", companyId }];
    },
  };

  const query = new GetCompanyServicesQuery(repository);
  const result = await query.execute({ companyId: 99 });

  assert.equal(receivedCompanyId, 99);
  assert.deepEqual(result, [{ serviceId: "srv-4", companyId: 99 }]);
});

test("GetServiceByIdQuery obtiene un servicio individual", async () => {
  let receivedServiceId;
  const repository = {
    async findById(serviceId) {
      receivedServiceId = serviceId;
      return { serviceId, serviceName: "Pago" };
    },
  };

  const query = new GetServiceByIdQuery(repository);
  const result = await query.execute({ serviceId: "srv-5" });

  assert.equal(receivedServiceId, "srv-5");
  assert.deepEqual(result, { serviceId: "srv-5", serviceName: "Pago" });
});
