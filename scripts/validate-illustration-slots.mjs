import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { materializeIllustrationSlots } from './materialize-illustration-slots.mjs';

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(process.cwd(), relativePath), 'utf8'));
}

const reachability = await readJson('data/type-catalog/v0.1-dev/reachability.json');
const illustrationSystem = await readJson('data/illustration/v0.1-dev/system.json');
const displayNameSystem = await readJson('data/type-catalog/v0.1-dev/display-name-system.ja.json');
const slots = materializeIllustrationSlots({ reachability, illustrationSystem });

assert.equal(slots.entry_count, 64);
assert.equal(slots.public_use, false);
assert.equal(slots.runtime_generation, false);
assert.deepEqual(slots.entries.map((entry) => entry.core_code), reachability.core_codes);

const assetIds = new Set();
for (const entry of slots.entries) {
  assert.equal(entry.type_id, `C01D-${entry.core_code}`);
  assert.equal(entry.asset_id, `ILL-C01D-${entry.core_code}-HERO-v01`);
  assert.ok(!assetIds.has(entry.asset_id), `${entry.core_code}: duplicate asset ID`);
  assetIds.add(entry.asset_id);
  assert.equal(entry.status, 'unproduced');
  assert.equal(entry.master_path, null);
  assert.equal(entry.public_use, false);
  assert.deepEqual(Object.keys(entry.variants), illustrationSystem.required_variants);
  assert.ok(Object.values(entry.variants).every((value) => value === null));
  assert.ok(entry.motif_contract.role.length >= 2);
  assert.ok(entry.motif_contract.action.length >= 2);
  assert.ok(entry.motif_contract.relationship.length >= 1);

  const roleName = displayNameSystem.cognitive_roles[entry.component_keys.role]?.label_ja;
  const actionName = displayNameSystem.action_modes[entry.component_keys.action]?.label_ja;
  const relationshipName = displayNameSystem.relationship_modes[entry.component_keys.relationship]?.label_ja;
  assert.equal(illustrationSystem.role_motifs[entry.component_keys.role]?.label_ja, roleName, `${entry.core_code}: role label drift between naming/art systems`);
  assert.ok(illustrationSystem.action_compositions[entry.component_keys.action]?.label_ja.includes(actionName), `${entry.core_code}: action label drift between naming/art systems`);
  assert.equal(illustrationSystem.relationship_compositions[entry.component_keys.relationship]?.label_ja, relationshipName, `${entry.core_code}: relationship label drift between naming/art systems`);
}
assert.equal(assetIds.size, 64);

for (const trope of illustrationSystem.prohibited_tropes) {
  assert.ok(typeof trope === 'string' && trope.length >= 4, 'prohibited trope IDs must be explicit strings');
}

console.log(`Illustration slot validation passed: ${slots.entry_count} unique static asset slots, complete component mapping, and naming/art vocabulary alignment.`);
