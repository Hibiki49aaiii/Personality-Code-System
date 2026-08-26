import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { materializeDevelopmentContentV03 } from '../../scripts/materialize-content-v0.3.mjs';

const require = createRequire(import.meta.url);
const { materializeReviewedItemBank } = require('../../.tmp-tests/src/domain/assessment/reviewedItemBank.js');
const { toScoringItem } = require('../../.tmp-tests/src/domain/assessment/itemBank.js');
const { buildStructuredAssessmentResult } = require('../../.tmp-tests/src/domain/assessment/resultEngine.js');
const { createResultSnapshot } = require('../../.tmp-tests/src/domain/assessment/resultSnapshot.js');

function loadJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8'));
}

function buildV03MidpointResult() {
  const manifest = loadJson('data/item-bank/v0.1/manifest.json');
  const baseItems = manifest.files.flatMap((file) => loadJson(`data/item-bank/v0.1/${file}`));
  const ledger = loadJson('data/item-bank/v0.2/review.json');
  const scoringItems = materializeReviewedItemBank(baseItems, ledger).map(toScoringItem);
  const answers = scoringItems.map((item) => ({ itemId: item.id, value: 3 }));

  const codeSchema = loadJson('data/code-schema/v0.1-dev.json');
  const interactionRules = loadJson('data/interactions/v0.1.json');
  const baseContent = loadJson('data/content/dev-v0.1.json');
  const v02Manifest = loadJson('data/content/dev-v0.2.json');
  const v03Manifest = loadJson('data/content/dev-v0.3.json');
  const scaffold = loadJson('data/type-catalog/v0.1-dev/editorial-scaffold.json');
  const typePrimitives = loadJson('data/type-catalog/v0.1-dev/editorial-primitives.ja.json');
  const traitPrimitives = loadJson('data/content/trait-editorial-primitives.ja-v0.1-dev.json');
  const content = materializeDevelopmentContentV03({
    manifest: v03Manifest,
    v02Manifest,
    baseContent,
    scaffold,
    typePrimitives,
    traitPrimitives
  });

  return buildStructuredAssessmentResult({
    versions: {
      resultSchemaVersion: 'structured-result-v0.1-dev',
      assessmentModelVersion: 'assessment-dev-v0.3',
      itemBankVersion: 'item-bank-v0.2',
      scoringVersion: 'scoring-v0.1-dev',
      codeSchemaVersion: codeSchema.code_schema_version,
      interactionVersion: interactionRules.interaction_version,
      contentVersion: content.content_version
    },
    locale: 'ja-JP',
    scoringItems,
    answers,
    codeSchema,
    interactionRules,
    contentModules: content.modules
  });
}

test('detailed Phase 3A midpoint result matches the frozen v0.3 snapshot exactly', () => {
  const expected = loadJson('tests/fixtures/result-snapshot-midpoint-v0.3.json');
  const result = buildV03MidpointResult();
  const actual = createResultSnapshot(result);

  assert.deepEqual(actual, expected);
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
  assert.equal(actual.versions.assessmentModelVersion, 'assessment-dev-v0.3');
  assert.equal(actual.versions.contentVersion, 'content-dev-v0.3');
  assert.equal(actual.personalityCode.coreCode, 'SVAEND');
  assert.equal(actual.sections.length, 18);
  assert.equal(actual.content.selectedIds.length, 26);
});

test('detailed Phase 3A midpoint result covers every required domain without selected fallbacks', () => {
  const result = buildV03MidpointResult();
  assert.equal(result.sections.length, 18);
  assert.ok(result.sections.every((section) => section.moduleIds.length >= 1));
  assert.ok(result.content.selectedIds.every((id) => !id.startsWith('DEV-FALLBACK-')));

  const expectedTraitModules = [
    'DEV-TRAIT-SYS-MID',
    'DEV-TRAIT-RDP-MID',
    'DEV-TRAIT-OPT-MID',
    'DEV-TRAIT-UNC-MID',
    'DEV-TRAIT-FIN-MID'
  ];
  for (const id of expectedTraitModules) assert.ok(result.content.selectedIds.includes(id), id);

  const expectedTypeModules = [
    'DEV-TYPE-SVAEND-IDENTITY',
    'DEV-TYPE-SVAEND-STRENGTHS',
    'DEV-TYPE-SVAEND-ADVERSARIAL'
  ];
  for (const id of expectedTypeModules) assert.ok(result.content.selectedIds.includes(id), id);
});
