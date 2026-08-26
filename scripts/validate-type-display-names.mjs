import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { materializeTypeDisplayNames } from './materialize-type-display-names.mjs';

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(process.cwd(), relativePath), 'utf8'));
}

const reachability = await readJson('data/type-catalog/v0.1-dev/reachability.json');
const namingSystem = await readJson('data/type-catalog/v0.1-dev/display-name-system.ja.json');
const catalog = materializeTypeDisplayNames({ reachability, namingSystem });

assert.equal(catalog.entry_count, 64, 'display-name catalog must cover exactly 64 reachable C01D codes');
assert.equal(catalog.entries.length, reachability.core_codes.length);
assert.deepEqual(catalog.entries.map((entry) => entry.core_code), reachability.core_codes, 'display-name order must follow frozen reachability');
assert.equal(catalog.public_use, false);

const names = new Set();
const identities = new Set();
const byCode = new Map();
const maxChars = namingSystem.contract.maximum_display_name_characters;
const forbidden = namingSystem.contract.forbidden_claim_terms;

for (const entry of catalog.entries) {
  assert.equal(entry.type_id, `C01D-${entry.core_code}`);
  assert.equal(entry.public_use, false);
  assert.ok(entry.display_name_ja.length <= maxChars, `${entry.core_code}: display name too long`);
  assert.ok(entry.identity_sentence_ja.length >= 30, `${entry.core_code}: identity sentence too short`);
  assert.ok(!names.has(entry.display_name_ja), `${entry.core_code}: duplicate display name ${entry.display_name_ja}`);
  assert.ok(!identities.has(entry.identity_sentence_ja), `${entry.core_code}: duplicate identity sentence`);
  names.add(entry.display_name_ja);
  identities.add(entry.identity_sentence_ja);
  byCode.set(entry.core_code, entry);

  for (const term of forbidden) {
    assert.ok(!entry.display_name_ja.includes(term), `${entry.core_code}: forbidden claim term ${term} in display name`);
    assert.ok(!entry.identity_sentence_ja.includes(term), `${entry.core_code}: forbidden claim term ${term} in identity sentence`);
  }

  assert.deepEqual(
    entry.provenance,
    [
      `core-axis:1:${entry.core_code[0]}`,
      `core-axis:2:${entry.core_code[1]}`,
      `core-axis:3:${entry.core_code[2]}`,
      `core-axis:4:${entry.core_code[3]}`,
      `core-axis:5:${entry.core_code[4]}`,
      `core-axis:6:${entry.core_code[5]}`
    ],
    `${entry.core_code}: provenance must cover exactly the six Core Code dimensions`
  );
}

assert.equal(names.size, 64);
assert.equal(identities.size, 64);
assert.equal(byCode.get('SVAEND')?.display_name_ja, '開拓の探究設計家〈深縁〉');

function hammingDistance(a, b) {
  let distance = 0;
  for (let index = 0; index < a.length; index += 1) if (a[index] !== b[index]) distance += 1;
  return distance;
}

for (const code of reachability.core_codes) {
  const source = byCode.get(code);
  assert.ok(source);
  const neighbors = reachability.core_codes.filter((candidate) => hammingDistance(code, candidate) === 1);
  assert.equal(neighbors.length, 6, `${code}: every 6-bit Core Code must have six one-axis neighbors`);
  for (const neighborCode of neighbors) {
    const neighbor = byCode.get(neighborCode);
    assert.ok(neighbor);
    assert.notEqual(source.display_name_ja, neighbor.display_name_ja, `${code}/${neighborCode}: one-axis neighbors must remain distinguishable`);
    assert.notEqual(source.identity_sentence_ja, neighbor.identity_sentence_ja, `${code}/${neighborCode}: one-axis neighbors need different identity sentences`);
  }
}

console.log(`Type display-name validation passed: ${catalog.entry_count} unique traceable names, six-axis provenance, and one-axis neighbor differentiation.`);
