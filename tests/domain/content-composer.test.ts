import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { TRAIT_IDS, type TraitId, type TraitScore } from '../../src/domain/assessment/scoring';
import { generatePersonalityCode, type CoreCodeSchema } from '../../src/domain/assessment/personalityCode';
import { evaluateInteractionRules, type InteractionRuleSet } from '../../src/domain/assessment/interactions';
import { composeContent, type ContentModule } from '../../src/domain/assessment/contentComposer';

function loadJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), relativePath), 'utf8')) as T;
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

function compose(overrides: Partial<Record<TraitId, number>>) {
  const traitScores = scores(overrides);
  const codeSchema = loadJson<CoreCodeSchema>('data/code-schema/v0.1-dev.json');
  const interactions = evaluateInteractionRules(
    traitScores,
    loadJson<InteractionRuleSet>('data/interactions/v0.1.json')
  );
  const contentData = loadJson<{ modules: ContentModule[] }>('data/content/dev-v0.1.json');
  return composeContent({
    locale: 'ja-JP',
    modules: contentData.modules,
    traitScores,
    interactions,
    personalityCode: generatePersonalityCode(traitScores, codeSchema)
  });
}

test('deep non-fused interaction suppresses conflicting generic RDP claim', () => {
  const result = compose({ RDP: 8000, BND: 8000 });
  assert.ok(result.selectedIds.includes('DEV-INT-007'));
  assert.ok(!result.selectedIds.includes('DEV-TRAIT-RDP-HIGH'));
  assert.ok(result.suppressedIds.includes('DEV-TRAIT-RDP-HIGH'));
  assert.ok(result.suppressedIds.includes('DEV-FALLBACK-LOVE'));
});

test('disciplined optimizer suppresses generic cannot-stop claim', () => {
  const result = compose({ OPT: 8000, FIN: 8000 });
  assert.ok(result.selectedIds.includes('DEV-INT-012'));
  assert.ok(!result.selectedIds.includes('DEV-TRAIT-OPT-HIGH'));
  const suppressed = result.suppressed.find((module) => module.id === 'DEV-TRAIT-OPT-HIGH');
  assert.equal(suppressed?.reason, 'suppressed-assertion-tag');
  assert.deepEqual(suppressed?.blockingTags, ['optimization.cannot-stop']);
});

test('generic trait module remains when suppressing interaction is inactive', () => {
  const result = compose({ OPT: 8000, FIN: 5000 });
  assert.ok(result.selectedIds.includes('DEV-TRAIT-OPT-HIGH'));
  assert.ok(!result.selectedIds.includes('DEV-INT-012'));
});

test('fallback is selected only when the domain has no non-fallback selection', () => {
  const result = compose({});
  assert.ok(result.selectedIds.includes('DEV-FALLBACK-WORK'));
  assert.ok(result.selectedIds.includes('DEV-FALLBACK-LOVE'));
  assert.ok(!result.selectedIds.includes('DEV-FALLBACK-CORE'));
  assert.ok(result.selectedIds.includes('DEV-LIMIT-001'));
});
