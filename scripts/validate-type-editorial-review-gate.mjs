import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const [ledger, gate, reachability, codeSchema, manifest, assetRegistry] = await Promise.all([
  readJson('data/type-catalog/v0.1-dev/editorial-review-ledger.ja.json'),
  readJson('data/type-catalog/v0.1-dev/publication-gate.json'),
  readJson('data/type-catalog/v0.1-dev/reachability.json'),
  readJson('data/code-schema/v0.1-dev.json'),
  readJson('data/type-catalog/v0.1-dev/editorial-catalog-manifest.ja.json'),
  readJson('data/illustration/v0.1-dev/asset-production-registry.json')
]);

const dimensions = [
  'name-system-consistency',
  'claim-provenance',
  'neighbor-differentiation',
  'non-clinical-language',
  'adversarial-tone',
  'relationship-work-stress-limitations',
  'japanese-proofreading',
  'final-editorial-approval'
];
const validStates = new Set(['pending','approved','changes-required']);

assert.equal(ledger.review_ledger_version, 'type-editorial-review-ledger-ja-v0.1-dev');
assert.equal(ledger.editorial_catalog_version, manifest.editorial_catalog_version);
assert.equal(ledger.code_schema_version, codeSchema.code_schema_version);
assert.equal(ledger.public_use, false);
assert.deepEqual(ledger.review_dimensions, dimensions);
assert.equal(ledger.entries.length, 64);
assert.deepEqual(ledger.entries.map((entry) => entry.core_code), reachability.core_codes);

for (const entry of ledger.entries) {
  assert.ok(validStates.has(entry.status), `${entry.core_code}: invalid review status`);
  assert.deepEqual(Object.keys(entry.dimensions), dimensions, `${entry.core_code}: review dimension drift`);
  for (const [dimension,state] of Object.entries(entry.dimensions)) {
    assert.ok(validStates.has(state), `${entry.core_code}/${dimension}: invalid state`);
  }
  const anyApproved = entry.status === 'approved' || Object.values(entry.dimensions).includes('approved');
  if (anyApproved) {
    assert.equal(typeof entry.reviewer, 'string', `${entry.core_code}: approved review needs reviewer`);
    assert.ok(entry.reviewer.trim().length >= 2, `${entry.core_code}: reviewer too short`);
    assert.ok(Number.isFinite(Date.parse(entry.reviewed_at)), `${entry.core_code}: approved review needs ISO date`);
  }
}

const allApproved = ledger.entries.every((entry) =>
  entry.status === 'approved' && Object.values(entry.dimensions).every((state) => state === 'approved')
);
const noOpenIssues = ledger.entries.every((entry) => Array.isArray(entry.issue_refs) && entry.issue_refs.length === 0);
const allIllustrationsApproved =
  assetRegistry.entries.length === reachability.core_codes.length &&
  assetRegistry.entries.every((entry, index) =>
    entry.core_code === reachability.core_codes[index] &&
    entry.status === 'approved' &&
    entry.master !== null &&
    Object.values(entry.variants ?? {}).every((value) => value !== null) &&
    Object.values(entry.approval?.checks ?? {}).every((value) => value === true)
  );

assert.equal(gate.publication_gate_version, 'type-catalog-publication-gate-v0.1-dev');
assert.equal(gate.requirements.code_schema_public_use_true, codeSchema.public_use === true);
assert.equal(gate.requirements.editorial_catalog_public_use_true, manifest.public_use === true);
assert.equal(gate.requirements.all_reachable_codes_present, ledger.entries.length === reachability.core_codes.length);
assert.equal(gate.requirements.all_review_dimensions_approved, allApproved);
assert.equal(gate.requirements.no_open_editorial_issues, noOpenIssues && allApproved);
assert.equal(gate.requirements.illustration_mapping_approved, allIllustrationsApproved);

if (codeSchema.public_use !== true || manifest.public_use !== true || !allApproved || !allIllustrationsApproved) {
  assert.equal(gate.public_catalog_ready, false);
  assert.equal(gate.status, 'blocked');
}

console.log(`Type editorial review gate validation passed: ${ledger.entries.length} reachable codes are explicitly review-tracked; editorial-approved=${ledger.entries.filter((entry)=>entry.status==='approved').length}; illustration-approved=${assetRegistry.entries.filter((entry)=>entry.status==='approved').length}; public catalog remains fail-closed.`);
