import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { AssessmentAnswer } from '../../src/domain/assessment/scoring';
import { toScoringItem, type CandidateItemRecord } from '../../src/domain/assessment/itemBank';
import { materializeReviewedItemBank, type ItemReviewLedger } from '../../src/domain/assessment/reviewedItemBank';
import type { CoreCodeSchema } from '../../src/domain/assessment/personalityCode';
import type { InteractionRuleSet } from '../../src/domain/assessment/interactions';
import type { ContentModule } from '../../src/domain/assessment/contentComposer';
import {
  buildStructuredAssessmentResult,
  ResultEngineError
} from '../../src/domain/assessment/resultEngine';

function loadJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), relativePath), 'utf8')) as T;
}

function loadReviewedBank() {
  const baseDir = path.join(process.cwd(), 'data', 'item-bank', 'v0.1');
  const manifest = loadJson<{ files: string[] }>('data/item-bank/v0.1/manifest.json');
  const baseItems = manifest.files.flatMap((file) =>
    JSON.parse(readFileSync(path.join(baseDir, file), 'utf8')) as CandidateItemRecord[]
  );
  const ledger = loadJson<ItemReviewLedger>('data/item-bank/v0.2/review.json');
  return materializeReviewedItemBank(baseItems, ledger);
}

function fixture(overrides?: { highTraits?: string[] }) {
  const reviewed = loadReviewedBank();
  const scoringItems = reviewed.map(toScoringItem);
  const high = new Set(overrides?.highTraits ?? []);
  const answers: AssessmentAnswer[] = scoringItems.map((item) => ({
    itemId: item.id,
    value: high.has(item.traitId) ? (item.direction === 1 ? 5 : 1) : 3
  }));
  const codeSchema = loadJson<CoreCodeSchema>('data/code-schema/v0.1-dev.json');
  const interactionRules = loadJson<InteractionRuleSet>('data/interactions/v0.1.json');
  const contentData = loadJson<{ content_version: string; modules: ContentModule[] }>('data/content/dev-v0.1.json');

  return {
    versions: {
      resultSchemaVersion: 'structured-result-v0.1-dev',
      assessmentModelVersion: 'assessment-dev-v0.1',
      itemBankVersion: 'item-bank-v0.2',
      scoringVersion: 'scoring-v0.1-dev',
      codeSchemaVersion: codeSchema.code_schema_version,
      interactionVersion: interactionRules.interaction_version,
      contentVersion: contentData.content_version
    },
    locale: 'ja-JP',
    scoringItems,
    answers,
    codeSchema,
    interactionRules,
    contentModules: contentData.modules
  } as const;
}

test('real reviewed 147-item midpoint fixture builds a complete deterministic structured result', () => {
  const result = buildStructuredAssessmentResult(fixture());
  console.log(`PCS_GOLDEN_JSON=${JSON.stringify(result)}`);
  assert.equal(result.scoring.traitScores.length, 21);
  for (const trait of result.scoring.traitScores) assert.equal(trait.scoreBp, 5000, trait.traitId);
  assert.equal(result.personalityCode.coreCode, 'SVAEND');
  assert.equal(result.interactions.activeIds.length, 0);
  assert.equal(result.sections.length, 18);
  assert.equal(result.content.selected.length, 18);
  assert.ok(result.content.selectedIds.includes('DEV-LIMIT-001'));
  assert.ok(result.content.suppressedIds.includes('DEV-FALLBACK-CORE'));
  for (const section of result.sections) assert.ok(section.moduleIds.length >= 1, section.domain);
});

test('same complete answers and versions return byte-for-byte-equivalent structured data', () => {
  const input = fixture();
  const first = buildStructuredAssessmentResult(input);
  const second = buildStructuredAssessmentResult({ ...input, answers: [...input.answers].reverse() });
  assert.deepEqual(second, first);
  assert.equal(JSON.stringify(second), JSON.stringify(first));
});

test('integrated interaction suppresses contradictory generic module', () => {
  const result = buildStructuredAssessmentResult(fixture({ highTraits: ['RDP', 'BND'] }));
  assert.ok(result.interactions.activeIds.includes('PCS-INT-007'));
  assert.ok(result.content.selectedIds.includes('DEV-INT-007'));
  assert.ok(result.content.suppressedIds.includes('DEV-TRAIT-RDP-HIGH'));
});

test('version mismatch fails before composing a result', () => {
  const input = fixture();
  assert.throws(
    () => buildStructuredAssessmentResult({
      ...input,
      versions: { ...input.versions, codeSchemaVersion: 'wrong-schema' }
    }),
    (error: unknown) => error instanceof ResultEngineError && error.code === 'VERSION_MISMATCH'
  );
});
