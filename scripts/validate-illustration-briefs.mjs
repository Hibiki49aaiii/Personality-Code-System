import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { materializeIllustrationBriefs } from './materialize-illustration-briefs.mjs';

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(process.cwd(), relativePath), 'utf8'));
}

const [briefSystem, illustrationSystem, editorialManifest, reachability, scaffold, namingSystem, primitives, codeSchema] = await Promise.all([
  readJson('data/illustration/v0.1-dev/brief-system.json'),
  readJson('data/illustration/v0.1-dev/system.json'),
  readJson('data/type-catalog/v0.1-dev/editorial-catalog-manifest.ja.json'),
  readJson('data/type-catalog/v0.1-dev/reachability.json'),
  readJson('data/type-catalog/v0.1-dev/editorial-scaffold.json'),
  readJson('data/type-catalog/v0.1-dev/display-name-system.ja.json'),
  readJson('data/type-catalog/v0.1-dev/editorial-primitives.ja.json'),
  readJson('data/code-schema/v0.1-dev.json')
]);

const briefs = materializeIllustrationBriefs({
  briefSystem, illustrationSystem, editorialManifest, reachability, scaffold, namingSystem, primitives, codeSchema
});

assert.equal(briefs.entry_count, 64);
assert.equal(briefs.public_use, false);
assert.equal(briefs.runtime_generation, false);
assert.deepEqual(briefs.entries.map((entry) => entry.core_code), reachability.core_codes);
assert.match(briefs.representation_note, /never inferred from personality/u);

const ids = new Set();
const representationCounts = new Map();

for (const entry of briefs.entries) {
  assert.equal(entry.status, 'brief-ready-asset-unproduced');
  assert.equal(entry.public_use, false);
  assert.equal(entry.runtime_generation, false);
  assert.equal(entry.representation_basis, 'catalog-index-rotation-only');
  assert.ok(!ids.has(entry.asset_id), `${entry.core_code}: duplicate asset id`);
  ids.add(entry.asset_id);
  representationCounts.set(entry.representation_variant, (representationCounts.get(entry.representation_variant) ?? 0) + 1);

  assert.ok(entry.scene_brief_ja.length >= 80);
  assert.match(entry.scene_brief_ja, /職業・能力・価値序列を表すのではなく/u);
  assert.equal(entry.style_contract.text_in_master, false);
  assert.equal(entry.master_path, null);
  assert.equal(entry.source_provenance, null);
  assert.ok(Object.values(entry.variants).every((value) => value === null));
  assert.deepEqual(Object.keys(entry.variants), illustrationSystem.required_variants);
  assert.deepEqual(entry.prohibited_tropes, illustrationSystem.prohibited_tropes);
  assert.deepEqual(Object.keys(entry.review_checks), briefSystem.review_checks);
  assert.ok(Object.values(entry.review_checks).every((value) => value === false));
}

assert.equal(ids.size, 64);
assert.equal(representationCounts.size, briefSystem.representation_rotation.length);
for (const variant of briefSystem.representation_rotation) {
  assert.equal(representationCounts.get(variant), 8, `representation rotation must assign exactly 8 slots to ${variant}`);
}

console.log('Illustration brief validation passed: 64 asset briefs, exact motif/crop contracts, balanced non-diagnostic representation rotation, all review gates open, and no runtime generation.');
