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
import { buildStructuredAssessmentResult } from '../../src/domain/assessment/resultEngine';
import { createResultSnapshot, createResultSnapshotV01, type ResultSnapshotV01 } from '../../src/domain/assessment/resultSnapshot';
import { DEVELOPMENT_FALLBACK_ILLUSTRATION_ASSET_VERSION } from '../../src/domain/illustration/fallbackAsset';

function loadJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), relativePath), 'utf8')) as T;
}

function buildMidpointResult() {
  const baseDir = path.join(process.cwd(), 'data', 'item-bank', 'v0.1');
  const manifest = loadJson<{ files: string[] }>('data/item-bank/v0.1/manifest.json');
  const baseItems = manifest.files.flatMap((file) =>
    JSON.parse(readFileSync(path.join(baseDir, file), 'utf8')) as CandidateItemRecord[]
  );
  const ledger = loadJson<ItemReviewLedger>('data/item-bank/v0.2/review.json');
  const reviewed = materializeReviewedItemBank(baseItems, ledger);
  const scoringItems = reviewed.map(toScoringItem);
  const answers: AssessmentAnswer[] = scoringItems.map((item) => ({ itemId: item.id, value: 3 }));
  const codeSchema = loadJson<CoreCodeSchema>('data/code-schema/v0.1-dev.json');
  const interactionRules = loadJson<InteractionRuleSet>('data/interactions/v0.1.json');
  const contentData = loadJson<{ content_version: string; modules: ContentModule[] }>('data/content/dev-v0.1.json');

  return buildStructuredAssessmentResult({
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
  });
}

test('midpoint result snapshot matches the frozen golden JSON exactly', () => {
  const expected = loadJson<ResultSnapshotV01>('tests/fixtures/result-snapshot-midpoint-v0.1.json');
  const actual = createResultSnapshotV01(buildMidpointResult());
  assert.deepEqual(actual, expected);
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
});

test('snapshot is structurally isolated from later result mutation', () => {
  const result = buildMidpointResult();
  const snapshot = createResultSnapshotV01(result);
  result.scoring.traitScores[0].scoreBp = 0;
  result.personalityCode.dimensions[0].symbol = 'X';
  result.content.selectedIds[0] = 'MUTATED';
  result.sections[0].moduleIds[0] = 'MUTATED';

  assert.equal(snapshot.traitScores[0].scoreBp, 5000);
  assert.equal(snapshot.personalityCode.dimensions[0].symbol, 'S');
  assert.equal(snapshot.content.selectedIds[0], 'DEV-LIMIT-001');
  assert.equal(snapshot.sections[0].moduleIds[0], 'DEV-LIMIT-001');
});


test('v0.2 snapshot freezes an exact illustration asset while v0.1 remains historically reproducible', () => {
  const result = buildMidpointResult();
  const snapshot = createResultSnapshot(result, {
    illustrationAssetVersion: DEVELOPMENT_FALLBACK_ILLUSTRATION_ASSET_VERSION
  });
  assert.equal(snapshot.snapshotSchemaVersion, 'result-snapshot-v0.2-dev');
  assert.equal(snapshot.assets.illustrationAssetVersion, DEVELOPMENT_FALLBACK_ILLUSTRATION_ASSET_VERSION);
  assert.equal(createResultSnapshotV01(result).snapshotSchemaVersion, 'result-snapshot-v0.1-dev');
});
