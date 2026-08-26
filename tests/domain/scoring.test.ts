import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AssessmentInputError,
  scoreAssessment,
  type AssessmentAnswer,
  type ScoringItem
} from '../../src/domain/assessment/scoring';

const items: ScoringItem[] = [
  { id: 'PCS-SYS-001', traitId: 'SYS', direction: 1, weightMilli: 1000, required: true },
  { id: 'PCS-SYS-002', traitId: 'SYS', direction: 1, weightMilli: 1000, required: true },
  { id: 'PCS-SYS-003', traitId: 'SYS', direction: 1, weightMilli: 1000, required: true },
  { id: 'PCS-SYS-004', traitId: 'SYS', direction: 1, weightMilli: 1000, required: true },
  { id: 'PCS-SYS-005', traitId: 'SYS', direction: -1, weightMilli: 1000, required: true },
  { id: 'PCS-SYS-006', traitId: 'SYS', direction: -1, weightMilli: 1000, required: true },
  { id: 'PCS-SYS-007', traitId: 'SYS', direction: -1, weightMilli: 1000, required: true }
];

function answers(values: number[]): AssessmentAnswer[] {
  return items.map((item, index) => ({
    itemId: item.id,
    value: values[index] as AssessmentAnswer['value']
  }));
}

function sysScore(values: number[]) {
  const result = scoreAssessment({ scoringVersion: 'score-v0.1-test', items, answers: answers(values) });
  assert.equal(result.traitScores.length, 1);
  return result.traitScores[0];
}

test('keyed minimum produces canonical zero', () => {
  const score = sysScore([1, 1, 1, 1, 5, 5, 5]);
  assert.equal(score.scoreBp, 0);
  assert.equal(score.displayScore, 0);
});

test('all midpoint responses produce exactly 50', () => {
  const result = scoreAssessment({ scoringVersion: 'score-v0.1-test', items, answers: answers([3, 3, 3, 3, 3, 3, 3]) });
  assert.equal(result.traitScores[0].scoreBp, 5000);
  assert.equal(result.traitScores[0].displayScore, 50);
  assert.deepEqual(result.responseQuality.flags.sort(), ['all_midpoint_responses', 'dominant_response_pattern']);
});

test('keyed maximum produces canonical 100', () => {
  const score = sysScore([5, 5, 5, 5, 1, 1, 1]);
  assert.equal(score.scoreBp, 10000);
  assert.equal(score.displayScore, 100);
});

test('raw all-min fixture proves reverse keys are applied', () => {
  const score = sysScore([1, 1, 1, 1, 1, 1, 1]);
  assert.equal(score.scoreBp, 4286);
  assert.equal(score.score, 42.86);
});

test('raw all-max fixture proves reverse keys are applied', () => {
  const score = sysScore([5, 5, 5, 5, 5, 5, 5]);
  assert.equal(score.scoreBp, 5714);
  assert.equal(score.score, 57.14);
});

test('answer and item ordering do not affect score', () => {
  const values = [5, 4, 3, 2, 1, 2, 4];
  const baseline = scoreAssessment({ scoringVersion: 'score-v0.1-test', items, answers: answers(values) });
  const reversedItems = [...items].reverse();
  const reversedAnswers = [...answers(values)].reverse();
  const reordered = scoreAssessment({ scoringVersion: 'score-v0.1-test', items: reversedItems, answers: reversedAnswers });
  assert.deepEqual(reordered, baseline);
});

test('missing required answer is rejected', () => {
  assert.throws(
    () => scoreAssessment({ scoringVersion: 'score-v0.1-test', items, answers: answers([3, 3, 3, 3, 3, 3]) }),
    (error: unknown) => error instanceof AssessmentInputError && error.code === 'MISSING_REQUIRED_ANSWER'
  );
});

test('duplicate answer is rejected', () => {
  const duplicate = [...answers([3, 3, 3, 3, 3, 3, 3]), { itemId: 'PCS-SYS-001', value: 4 as const }];
  assert.throws(
    () => scoreAssessment({ scoringVersion: 'score-v0.1-test', items, answers: duplicate }),
    (error: unknown) => error instanceof AssessmentInputError && error.code === 'DUPLICATE_ANSWER'
  );
});

test('unknown item answer is rejected', () => {
  const unknown: AssessmentAnswer[] = [...answers([3, 3, 3, 3, 3, 3, 3]), { itemId: 'UNKNOWN', value: 3 }];
  assert.throws(
    () => scoreAssessment({ scoringVersion: 'score-v0.1-test', items, answers: unknown }),
    (error: unknown) => error instanceof AssessmentInputError && error.code === 'UNKNOWN_ITEM'
  );
});

test('mixed golden fixture is stable', () => {
  const score = sysScore([5, 4, 3, 2, 1, 2, 4]);
  // keyed points: 4+3+2+1 + 4+3+1 = 18 of 28 => 64.29
  assert.equal(score.keyedPointsWeighted, 18000);
  assert.equal(score.maxPointsWeighted, 28000);
  assert.equal(score.scoreBp, 6429);
  assert.equal(score.displayScore, 64);
});
