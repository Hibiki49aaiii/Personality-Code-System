import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { scoreAssessment, type AssessmentAnswer } from '../../src/domain/assessment/scoring';
import { toScoringItem, type CandidateItemRecord } from '../../src/domain/assessment/itemBank';
import {
  materializeReviewedItemBank,
  type ItemReviewLedger
} from '../../src/domain/assessment/reviewedItemBank';

function loadBase(): CandidateItemRecord[] {
  const base = path.join(process.cwd(), 'data', 'item-bank', 'v0.1');
  const manifest = JSON.parse(readFileSync(path.join(base, 'manifest.json'), 'utf8')) as { files: string[] };
  return manifest.files.flatMap((file) => JSON.parse(readFileSync(path.join(base, file), 'utf8')) as CandidateItemRecord[]);
}

function loadReviewed() {
  const baseItems = loadBase();
  const dir = path.join(process.cwd(), 'data', 'item-bank', 'v0.2');
  const ledger = JSON.parse(readFileSync(path.join(dir, 'review.json'), 'utf8')) as ItemReviewLedger;
  return { baseItems, reviewed: materializeReviewedItemBank(baseItems, ledger) };
}

test('review ledger covers all 147 items exactly once', () => {
  const { reviewed } = loadReviewed();
  assert.equal(reviewed.length, 147);
  const counts = new Map<string, number>();
  for (const item of reviewed) counts.set(item.review_disposition, (counts.get(item.review_disposition) ?? 0) + 1);
  assert.equal(counts.get('accept-r1'), 98);
  assert.equal(counts.get('revise-r2'), 39);
  assert.equal(counts.get('hold-for-beta'), 10);
  assert.equal(reviewed.filter((item) => item.revision === 'r2').length, 39);
  assert.equal(reviewed.filter((item) => item.status === 'reviewed').length, 147);
});

test('review preserves trait, direction, weight, IDs, and order', () => {
  const { baseItems, reviewed } = loadReviewed();
  assert.equal(reviewed.length, baseItems.length);
  reviewed.forEach((item, index) => {
    const base = baseItems[index];
    assert.equal(item.id, base.id);
    assert.equal(item.primary_trait, base.primary_trait, item.id);
    assert.equal(item.direction, base.direction, item.id);
    assert.equal(item.weight, base.weight, item.id);
  });
});

test('reviewed bank retains exact midpoint and keyed endpoints', () => {
  const { reviewed } = loadReviewed();
  const items = reviewed.map(toScoringItem);
  const midpoint: AssessmentAnswer[] = items.map((item) => ({ itemId: item.id, value: 3 }));
  const low: AssessmentAnswer[] = items.map((item) => ({ itemId: item.id, value: item.direction === 1 ? 1 : 5 }));
  const high: AssessmentAnswer[] = items.map((item) => ({ itemId: item.id, value: item.direction === 1 ? 5 : 1 }));

  const middleResult = scoreAssessment({ scoringVersion: 'scoring-v0.1-dev', items, answers: midpoint });
  const lowResult = scoreAssessment({ scoringVersion: 'scoring-v0.1-dev', items, answers: low });
  const highResult = scoreAssessment({ scoringVersion: 'scoring-v0.1-dev', items, answers: high });

  assert.equal(middleResult.traitScores.length, 21);
  for (const trait of middleResult.traitScores) assert.equal(trait.scoreBp, 5000, trait.traitId);
  for (const trait of lowResult.traitScores) assert.equal(trait.scoreBp, 0, trait.traitId);
  for (const trait of highResult.traitScores) assert.equal(trait.scoreBp, 10000, trait.traitId);
});
