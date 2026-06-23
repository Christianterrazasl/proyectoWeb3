import test from "node:test";
import assert from "node:assert/strict";

import { CreateCompanyCommand } from "./CreateCompanyCommand.js";
import { CreateServiceCommand } from "./CreateServiceCommand.js";

test("CreateCompanyCommand guarda la empresa creada usando el CommandHandler real", async () => {
  const savedCompanies = [];
  const repository = {
    async save(company) {
      savedCompanies.push(company);
    },
  };

  const command = new CreateCompanyCommand(repository);
  const result = await command.execute({
    id: "42",
    name: "Empresa Demo",
  });

  assert.equal(savedCompanies.length, 1);
  assert.equal(savedCompanies[0].id, "42");
  assert.equal(savedCompanies[0].name, "Empresa Demo");
  assert.equal(savedCompanies[0].status, "ACTIVE");
  assert.deepEqual(result, {
    id: "42",
    name: "Empresa Demo",
    status: "ACTIVE",
  });
});

test("CreateServiceCommand guarda el servicio creado usando el CommandHandler real", async () => {
  const savedServices = [];
  const repository = {
    async save(service) {
      savedServices.push(service);
    },
  };

  const command = new CreateServiceCommand(repository);
  const result = await command.execute({
    id: "energia_hogar",
    companyId: "42",
    name: "Energía hogar",
    inputSchema: {
      fields: [
        {
          name: "customerRef",
          type: "string",
        },
      ],
    },
  });

  assert.equal(savedServices.length, 1);
  assert.equal(savedServices[0].id, "energia_hogar");
  assert.equal(savedServices[0].companyId, "42");
  assert.equal(savedServices[0].name, "Energía hogar");
  assert.equal(savedServices[0].active, true);
  assert.deepEqual(result, {
    id: "energia_hogar",
    name: "Energía hogar",
    active: true,
  });
});
