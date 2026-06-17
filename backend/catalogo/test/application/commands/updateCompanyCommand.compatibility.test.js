import test from "node:test";
import assert from "node:assert/strict";

import { UpdateCompanyCommand } from "../../../src/application/commands/UpdateCompanyCommand.js";
import { UpdateCompanyCommand as UpdateCompanyCommandFromTypo } from "../../../src/application/commands/UpdateCompannyCommand.js";

test("UpdateCompanyCommand mantiene compatibilidad entre el nombre canonico y el typo", () => {
  assert.equal(UpdateCompanyCommandFromTypo, UpdateCompanyCommand);
});

test("UpdateCompanyCommand importado desde ambos paths ejecuta la misma implementacion", async () => {
  const repository = {
    async findById(id) {
      return { id, name: "Acme" };
    },
    async update() {
      return undefined;
    },
  };

  const commandFromCanonicalPath = new UpdateCompanyCommand(repository);
  const commandFromTypoPath = new UpdateCompanyCommandFromTypo(repository);

  const [canonicalResult, typoResult] = await Promise.all([
    commandFromCanonicalPath.execute(7, { name: "Nuevo nombre" }),
    commandFromTypoPath.execute(7, { name: "Nuevo nombre" }),
  ]);

  assert.deepEqual(canonicalResult, { id: 7, name: "Nuevo nombre" });
  assert.deepEqual(typoResult, canonicalResult);
});
