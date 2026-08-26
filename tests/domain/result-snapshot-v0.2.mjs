import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { materializeDevelopmentContentV02 } from '../../scripts/materialize-content-v0.2.mjs';

const require = createRequire(import.meta.url);
const { materializeReviewedItemBank } = require('../../.tmp-tests/src/domain/assessment/reviewedItemBank.js');
const { toScoringItem } = require('../../.tmp-tests/src/domain/assessment/itemBank.js');
const { buildStructuredAssessmentResult } = require('../../.tmp-tests/src/domain/assessment/resultEngine.js');
const { createResultSnapshot } = require('../../.tmp-tests/src/domain/assessment/resultSnapshot.js');

function loadJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8'));
}

function buildV02MidpointResult() {
  const manifest = loadJson('data/item-bank/v0.1/manifest.json');
  const baseItems = manifest.files.flatMap((file) => loadJson(`data/item-bank/v0.1/${file}`));
  const ledger = loadJson('data/item-bank/v0.2/review.json');
  const scoringItems = materializeReviewedItemBank(baseItems, ledger).map(toScoringItem);
  const answers = scoringItems.map((item) => ({ itemId: item.id, value: 3 }));

  const codeSchema = loadJson('data/code-schema/v0.1-dev.json');
  const interactionRules = loadJson('data/interactions/v0.1.json');
  const baseContent = loadJson('data/content/dev-v0.1.json');
  const contentManifest = loadJson('data/content/dev-v0.2.json');
  const scaffold = loadJson('data/type-catalog/v0.1-dev/editorial-scaffold.json');
  const primitives = loadJson('data/type-catalog/v0.1-dev/editorial-primitives.ja.json');
  const content = materializeDevelopmentContentV02({
    manifest: contentManifest,
    baseContent,
    scaffold,
    primitives
  });

  return buildStructuredAssessmentResult({
    versions: {
      resultSchemaVersion: 'structured-result-v0.1-dev',
      assessmentModelVersion: 'assessment-dev-v0.2',
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

test('Phase 3A midpoint result matches the frozen v0.2 snapshot exactly', () => {
  const expected = loadJson('tests/fixtures/result-snapshot-midpoint-v0.2.json');
  const result = buildV02MidpointResult();
  const actual = createResultSnapshot(result);
  assert.deepEqual(actual, expected);
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));

  assert.equal(actual.personalityCode.coreCode, 'SVAEND');
  assert.ok(actual.content.selectedIds.includes('DEV-TYPE-SVAEND-IDENTITY'));
  assert.ok(actual.content.selectedIds.includes('DEV-TYPE-SVAEND-STRENGTHS'));
  assert.ok(actual.content.selectedIds.includes('DEV-TYPE-SVAEND-ADVERSARIAL'));

  const identity = result.sections.find((section) => section.domain === 'core-identity');
  assert.ok(identity?.texts.some((text) => text.includes('深度・開拓実行型 自律検証設計者')));
});

test('Phase 3A type-specific modules replace only their domain fallbacks', () => {
  const result = buildV02MidpointResult();
  const suppressed = new Set(result.content.suppressedIds);
  assert.ok(suppressed.has('DEV-FALLBACK-CORE'));
  assert.ok(suppressed.has('DEV-FALLBACK-HIDDEN'));
  assert.ok(suppressed.has('DEV-FALLBACK-ADV'));
  assert.ok(result.content.selectedIds.includes('DEV-FALLBACK-WORK'));
  assert.ok(result.content.selectedIds.includes('DEV-FALLBACK-LOVE'));
});
