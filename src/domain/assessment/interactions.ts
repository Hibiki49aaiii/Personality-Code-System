import { TRAIT_IDS, type TraitId, type TraitScore } from './scoring';

export type ComparisonOp = 'gte' | 'lte';

export interface TraitCondition {
  trait_id: TraitId;
  op: ComparisonOp;
  score_bp: number;
}

export interface InteractionRule {
  id: string;
  name: string;
  all: TraitCondition[];
  domains: string[];
  assertion_tags: string[];
  suppresses_tags: string[];
}

export interface InteractionRuleSet {
  interaction_version: string;
  status: string;
  source_spec: string;
  rules: InteractionRule[];
}

export interface ActiveInteraction {
  id: string;
  name: string;
  domains: string[];
  assertionTags: string[];
  suppressesTags: string[];
}

export interface InteractionEvaluationResult {
  interactionVersion: string;
  active: ActiveInteraction[];
  activeIds: string[];
}

export class InteractionRuleError extends Error {
  constructor(
    public readonly code:
      | 'INVALID_RULESET'
      | 'INVALID_RULE'
      | 'DUPLICATE_RULE_ID'
      | 'DUPLICATE_TRAIT_SCORE'
      | 'INVALID_TRAIT_SCORE'
      | 'MISSING_TRAIT_SCORE',
    message: string
  ) {
    super(message);
    this.name = 'InteractionRuleError';
  }
}

function validateRuleSet(ruleSet: InteractionRuleSet): void {
  if (!ruleSet.interaction_version?.trim()) {
    throw new InteractionRuleError('INVALID_RULESET', 'interaction_version is required');
  }
  if (!Array.isArray(ruleSet.rules)) {
    throw new InteractionRuleError('INVALID_RULESET', 'rules must be an array');
  }

  const seenIds = new Set<string>();
  for (const rule of ruleSet.rules) {
    if (!/^PCS-INT-\d{3}$/.test(rule.id)) {
      throw new InteractionRuleError('INVALID_RULE', `invalid rule id ${rule.id}`);
    }
    if (seenIds.has(rule.id)) {
      throw new InteractionRuleError('DUPLICATE_RULE_ID', `duplicate interaction rule ${rule.id}`);
    }
    seenIds.add(rule.id);
    if (!rule.name?.trim()) throw new InteractionRuleError('INVALID_RULE', `${rule.id}: name required`);
    if (!Array.isArray(rule.all) || rule.all.length < 2) {
      throw new InteractionRuleError('INVALID_RULE', `${rule.id}: at least two conditions required`);
    }
    for (const condition of rule.all) {
      if (!TRAIT_IDS.includes(condition.trait_id)) {
        throw new InteractionRuleError('INVALID_RULE', `${rule.id}: unknown trait ${condition.trait_id}`);
      }
      if (condition.op !== 'gte' && condition.op !== 'lte') {
        throw new InteractionRuleError('INVALID_RULE', `${rule.id}: invalid op ${String(condition.op)}`);
      }
      if (!Number.isSafeInteger(condition.score_bp) || condition.score_bp < 0 || condition.score_bp > 10000) {
        throw new InteractionRuleError('INVALID_RULE', `${rule.id}: invalid score threshold`);
      }
    }
    if (!Array.isArray(rule.domains) || rule.domains.length === 0) {
      throw new InteractionRuleError('INVALID_RULE', `${rule.id}: domains required`);
    }
    if (!Array.isArray(rule.assertion_tags) || rule.assertion_tags.length === 0) {
      throw new InteractionRuleError('INVALID_RULE', `${rule.id}: assertion_tags required`);
    }
    if (!Array.isArray(rule.suppresses_tags)) {
      throw new InteractionRuleError('INVALID_RULE', `${rule.id}: suppresses_tags must be an array`);
    }
  }
}

function buildScoreMap(traitScores: readonly TraitScore[]): Map<TraitId, number> {
  const scores = new Map<TraitId, number>();
  for (const score of traitScores) {
    if (scores.has(score.traitId)) {
      throw new InteractionRuleError('DUPLICATE_TRAIT_SCORE', `duplicate trait score ${score.traitId}`);
    }
    if (!Number.isSafeInteger(score.scoreBp) || score.scoreBp < 0 || score.scoreBp > 10000) {
      throw new InteractionRuleError('INVALID_TRAIT_SCORE', `invalid scoreBp for ${score.traitId}`);
    }
    scores.set(score.traitId, score.scoreBp);
  }
  return scores;
}

function conditionMatches(scoreBp: number, condition: TraitCondition): boolean {
  return condition.op === 'gte' ? scoreBp >= condition.score_bp : scoreBp <= condition.score_bp;
}

export function evaluateInteractionRules(
  traitScores: readonly TraitScore[],
  ruleSet: InteractionRuleSet
): InteractionEvaluationResult {
  validateRuleSet(ruleSet);
  const scores = buildScoreMap(traitScores);
  const active: ActiveInteraction[] = [];

  for (const rule of ruleSet.rules) {
    let matches = true;
    for (const condition of rule.all) {
      const scoreBp = scores.get(condition.trait_id);
      if (scoreBp === undefined) {
        throw new InteractionRuleError(
          'MISSING_TRAIT_SCORE',
          `${rule.id}: missing trait score ${condition.trait_id}`
        );
      }
      if (!conditionMatches(scoreBp, condition)) {
        matches = false;
        break;
      }
    }
    if (matches) {
      active.push({
        id: rule.id,
        name: rule.name,
        domains: [...rule.domains],
        assertionTags: [...rule.assertion_tags],
        suppressesTags: [...rule.suppresses_tags]
      });
    }
  }

  return {
    interactionVersion: ruleSet.interaction_version,
    active,
    activeIds: active.map((rule) => rule.id)
  };
}
