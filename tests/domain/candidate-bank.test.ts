import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { scoreAssessment, type AssessmentAnswer } from '../../src/domain/assessment/scoring';
import { toScoringItem, type CandidateItemRecord } from '../../src/domain/assessment/itemBank';

function loadBank(): CandidateItemRecord[] {
  const base = path.join(process.cwd(), 'data', 'item-bank', 'v0.1');
  const manifest = JSON.parse(readFileSync(path.join(base, 'manifest.json'), 'utf8')) as { files: string[] };
  return manifest.files.flatMap((file) => JSON.parse(readFileSync(path.join(base, file), 'utf8')) as CandidateItemRecord[]);
}

test('147-item bank maps to 21 midpoint trait scores of exactly 50', () => {
  const records = loadBank();
  const items = records.map(toScoringItem);
  const answers: AssessmentAnswer[] = items.map((item) => ({ itemId: item.id, value: 3 }));
  const result = scoreAssessment({ scoringVersion: 'scoring-v0.1-dev', items, answers });
  assert.equal(records.length, 147);
  assert.equal(result.traitScores.length, 21);
  for (const trait of result.traitScores) assert.equal(trait.scoreBp, 5000, trait.traitId);
});

test('147-item bank supports exact keyed endpoints for every trait', () => {
  const records = loadBank();
  const items = records.map(toScoringItem);
  const low: AssessmentAnswer[] = items.map((item) => ({ itemId: item.id, value: item.direction === 1 ? 1 : 5 }));
  const high: AssessmentAnswer[] = items.map((item) => ({ itemId: item.id, value: item.direction === 1 ? 5 : 1 }));
  const lowResult = scoreAssessment({ scoringVersion: 'scoring-v0.1-dev', items, answers: low });
  const highResult = scoreAssessment({ scoringVersion: 'scoring-v0.1-dev', items, answers: high });
  for (const trait of lowResult.traitScores) assert.equal(trait.scoreBp, 0, trait.traitId);
  for (const trait of highResult.traitScores) assert.equal(trait.scoreBp, 10000, trait.traitId);
});
