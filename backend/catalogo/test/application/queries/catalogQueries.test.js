import test from "node:test";
import assert from "node:assert/strict";

import { ListAdminServicesQuery } from "../../../src/application/queries/ListAdminServicesQuery.js";
import { GetCatalogQuery } from "../../../src/application/queries/GetCatalogQuery.js";
import { GetCompanyServicesQuery } from "../../../src/application/queries/GetCompanyServicesQuery.js";
import { GetServiceByIdQuery } from "../../../src/application/queries/GetServiceByIdQuery.js";

test("ListAdminServicesQuery usa findAll cuando no hay companyId", async () => {
  let called = "";
  const repository = {
    async findAllForRead() {
      called = "findAllForRead";
      return [{ serviceId: "srv-1" }];
    },
    async findByCompanyId() {
      throw new Error("no debe llamarse");
    },
  };

  const query = new ListAdminServicesQuery(repository);
  const result = await query.execute({ companyId: null });

  assert.equal(called, "findAllForRead");
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
  const result = await query.execute(7);

  assert.equal(receivedCompanyId, 7);
  assert.deepEqual(result, [{ serviceId: "srv-2", companyId: 7 }]);
});

test("GetCatalogQuery mapea servicios con companyName real", async () => {
  const serviceRepository = {
    async findAllActiveForRead() {
      return [
        {
          serviceId: "srv-3",
          serviceName: "Pago colegio",
          companyId: 9,
          inputSchema: { label: "CI" },
          category: "Educación",
          description: "Pago mensual",
          companyLogoUrl: "https://cdn/logo.png",
        },
      ];
    },
  };
  const companyRepository = {
    async findAllForRead() {
      return [{ companyId: 9, name: "Colegio Real" }];
    },
  };

  const query = new GetCatalogQuery(serviceRepository, companyRepository);
  const result = await query.execute();

  assert.deepEqual(result, [
    {
      id: "srv-3",
      name: "Pago colegio",
      companyId: 9,
      companyName: "Colegio Real",
      inputSchema: { label: "CI" },
      category: "Educación",
      description: "Pago mensual",
      logoUrl: "https://cdn/logo.png",
    },
  ]);
});

test("GetCatalogQuery excluye filas inconsistentes sin companyName real", async () => {
  const serviceRepository = {
    async findAllActiveForRead() {
      return [
        {
          serviceId: "srv-4",
          serviceName: "Pago huérfano",
          companyId: 10,
          inputSchema: { label: "CI" },
        },
      ];
    },
  };
  const companyRepository = {
    async findAllForRead() {
      return [];
    },
  };

  const query = new GetCatalogQuery(serviceRepository, companyRepository);
  const result = await query.execute();

  assert.deepEqual(result, []);
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
