import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { materializeTypeEditorialCatalog } from './materialize-type-editorial-catalog.mjs';

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(process.cwd(), relativePath), 'utf8'));
}

const [manifest, reachability, scaffold, namingSystem, primitives, codeSchema] = await Promise.all([
  readJson('data/type-catalog/v0.1-dev/editorial-catalog-manifest.ja.json'),
  readJson('data/type-catalog/v0.1-dev/reachability.json'),
  readJson('data/type-catalog/v0.1-dev/editorial-scaffold.json'),
  readJson('data/type-catalog/v0.1-dev/display-name-system.ja.json'),
  readJson('data/type-catalog/v0.1-dev/editorial-primitives.ja.json'),
  readJson('data/code-schema/v0.1-dev.json')
]);

const catalog = materializeTypeEditorialCatalog({ manifest, reachability, scaffold, namingSystem, primitives, codeSchema });
assert.equal(catalog.entry_count, 64);
assert.equal(catalog.entries.length, 64);
assert.equal(catalog.public_use, false);
assert.deepEqual(catalog.entries.map((entry) => entry.core_code), reachability.core_codes);

const requiredTextFields = [
  'public_name_draft_ja','identity_sentence_ja','overview_ja','strengths_ja','adversarial_ja',
  'relationship_love_ja','work_ja','stress_ja','growth_guidance_ja','personal_manual_ja'
];
const prohibitedPatterns = [
  /天才/u,/最強/u,/選ばれた/u,/高知能/u,/劣等/u,/人格障害/u,/発達障害/u,/嘘つき/u,
  /科学的に証明/u,/必ず/u,/運命/u
];
const allowedProvenance = /^(?:core-axis:[1-6]:[A-Z]|limitation:[a-z0-9_-]+)$/;
const byCode = new Map();

for (const entry of catalog.entries) {
  assert.equal(entry.type_id, `C01D-${entry.core_code}`);
  assert.equal(entry.status, 'draft-machine-composed');
  assert.equal(entry.public_use, false);
  assert.equal(entry.illustration.status, 'unassigned');
  assert.equal(entry.illustration.asset_id, null);
  byCode.set(entry.core_code, entry);

  for (const field of requiredTextFields) {
    assert.equal(typeof entry[field], 'string', `${entry.core_code}: ${field} must be text`);
    assert.ok(entry[field].trim().length >= 20, `${entry.core_code}: ${field} too short`);
    for (const pattern of prohibitedPatterns) {
      assert.ok(!pattern.test(entry[field]), `${entry.core_code}: ${field} contains prohibited pattern ${pattern}`);
    }
  }

  assert.match(entry.relationship_love_ja, /BND・REC・CON・EMO・COG/u);
  assert.match(entry.work_ja, /FIN・PER・OPT・RSK/u);
  assert.match(entry.stress_ja, /STR・UNC・RSK・EMO/u);
  assert.deepEqual(entry.claim_provenance.stress_ja, ['limitation:stress_noncore']);

  for (const [field, provenance] of Object.entries(entry.claim_provenance)) {
    assert.ok(requiredTextFields.includes(field), `${entry.core_code}: unknown provenance field ${field}`);
    assert.ok(Array.isArray(provenance) && provenance.length > 0, `${entry.core_code}: empty provenance ${field}`);
    for (const atom of provenance) assert.match(atom, allowedProvenance, `${entry.core_code}: invalid provenance atom ${atom}`);
  }

  assert.equal(entry.neighbor_differentiation.length, 6);
  const neighborCodes = new Set();
  for (const neighbor of entry.neighbor_differentiation) {
    assert.ok(reachability.core_codes.includes(neighbor.neighbor_code));
    assert.ok(!neighborCodes.has(neighbor.neighbor_code));
    neighborCodes.add(neighbor.neighbor_code);
    const source = entry.core_code;
    const target = neighbor.neighbor_code;
    const differences = [...source].filter((symbol, index) => symbol !== target[index]).length;
    assert.equal(differences, 1, `${source}/${target}: neighbor must differ at exactly one axis`);
    assert.ok(neighbor.note_ja.includes('その他5つのCore anchorは同一'));
  }
}

for (const entry of catalog.entries) {
  for (const neighbor of entry.neighbor_differentiation) {
    const reverse = byCode.get(neighbor.neighbor_code)?.neighbor_differentiation.find((row) => row.neighbor_code === entry.core_code);
    assert.ok(reverse, `${entry.core_code}/${neighbor.neighbor_code}: missing reverse neighbor note`);
    assert.equal(reverse.changed_axis_position, neighbor.changed_axis_position);
    assert.equal(reverse.trait_id, neighbor.trait_id);
  }
}

console.log('Type editorial catalog validation passed: 64 complete non-public draft entries, required editorial fields, limitation-safe stress/work/relationship copy, claim provenance, and bidirectional six-neighbor differentiation.');
