import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { TRAIT_IDS, type TraitId, type TraitScore } from '../../src/domain/assessment/scoring';
import {
  evaluateInteractionRules,
  InteractionRuleError,
  type InteractionRuleSet
} from '../../src/domain/assessment/interactions';

function loadRules(): InteractionRuleSet {
  return JSON.parse(
    readFileSync(path.join(process.cwd(), 'data', 'interactions', 'v0.1.json'), 'utf8')
  ) as InteractionRuleSet;
}

function scores(overrides: Partial<Record<TraitId, number>> = {}): TraitScore[] {
  return TRAIT_IDS.map((traitId) => {
    const scoreBp = overrides[traitId] ?? 5000;
    return {
      traitId,
      keyedPointsWeighted: scoreBp,
      maxPointsWeighted: 10000,
      scoreBp,
      score: scoreBp / 100,
      displayScore: Math.floor((scoreBp + 50) / 100),
      answeredItems: 7
    };
  });
}

test('high VER + high ADV activates forensic verification only', () => {
  const result = evaluateInteractionRules(scores({ VER: 7000, ADV: 7000 }), loadRules());
  assert.ok(result.activeIds.includes('PCS-INT-001'));
  assert.ok(!result.activeIds.includes('PCS-INT-002'));
});

test('high VER + low ADV activates precision verification', () => {
  const result = evaluateInteractionRules(scores({ VER: 7000, ADV: 3000 }), loadRules());
  assert.ok(result.activeIds.includes('PCS-INT-002'));
  assert.ok(!result.activeIds.includes('PCS-INT-001'));
});

test('interaction boundaries are inclusive exactly as specified', () => {
  const atBoundary = evaluateInteractionRules(scores({ OPT: 6600, FIN: 6600 }), loadRules());
  assert.ok(atBoundary.activeIds.includes('PCS-INT-012'));

  const belowBoundary = evaluateInteractionRules(scores({ OPT: 6599, FIN: 6600 }), loadRules());
  assert.ok(!belowBoundary.activeIds.includes('PCS-INT-012'));
});

test('input score order does not affect interaction output', () => {
  const ruleSet = loadRules();
  const input = scores({ RDP: 8000, BND: 8000, REC: 8000, CON: 8000 });
  const forward = evaluateInteractionRules(input, ruleSet);
  const reversed = evaluateInteractionRules([...input].reverse(), ruleSet);
  assert.deepEqual(reversed, forward);
});

test('missing score required by a rule fails rather than defaulting', () => {
  const input = scores().filter((score) => score.traitId !== 'VER');
  assert.throws(
    () => evaluateInteractionRules(input, loadRules()),
    (error: unknown) => error instanceof InteractionRuleError && error.code === 'MISSING_TRAIT_SCORE'
  );
});

test('rule register contains all 20 versioned hypotheses in canonical order', () => {
  const ruleSet = loadRules();
  assert.equal(ruleSet.rules.length, 20);
  assert.deepEqual(
    ruleSet.rules.map((rule) => rule.id),
    Array.from({ length: 20 }, (_, index) => `PCS-INT-${String(index + 1).padStart(3, '0')}`)
  );
});
