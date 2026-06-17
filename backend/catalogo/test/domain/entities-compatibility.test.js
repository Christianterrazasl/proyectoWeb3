import test from "node:test";
import assert from "node:assert/strict";

import { Company as CompanyEntity } from "../../src/domain/entities/Company.js";
import { Company as CompanyModel } from "../../src/domain/models/Company.js";
import { Service as ServiceEntity } from "../../src/domain/entities/Service.js";
import { Service as ServiceModel } from "../../src/domain/models/Service.js";

test("Company mantiene compatibilidad entre entities y models", () => {
  assert.equal(CompanyModel, CompanyEntity);

  const company = new CompanyModel(1, "Acme", "123", "APPROVED", true);
  assert.equal(company.isActive(), true);
});

test("Service mantiene compatibilidad entre entities y models", () => {
  assert.equal(ServiceModel, ServiceEntity);

  const service = new ServiceModel("srv-1", 1, "Pago Luz", { fields: [] }, false);
  assert.equal(service.name, "Pago Luz");
  assert.equal(service.isPublished, false);
});
