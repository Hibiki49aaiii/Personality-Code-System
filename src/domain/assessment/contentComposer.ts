import type { PersonalityCodeResult } from './personalityCode';
import type { TraitId, TraitScore } from './scoring';
import type { InteractionEvaluationResult } from './interactions';

export type ContentDomain =
  | 'core-identity'
  | 'trait-overview'
  | 'thinking'
  | 'emotion'
  | 'action'
  | 'relationships-love'
  | 'work'
  | 'stress'
  | 'communication'
  | 'decision-making'
  | 'learning'
  | 'leadership-derived'
  | 'risk'
  | 'creativity'
  | 'hidden-strengths'
  | 'adversarial'
  | 'growth'
  | 'personal-manual';

export type ContentActivation =
  | { kind: 'always' }
  | { kind: 'interaction'; interaction_id: string }
  | { kind: 'trait_range'; trait_id: TraitId; min_bp?: number; max_bp?: number }
  | { kind: 'core_code'; codes: string[] }
  | { kind: 'fallback' };

export interface ContentModule {
  id: string;
  locale: string;
  domain: ContentDomain;
  priority: number;
  activation: ContentActivation;
  assertion_tags: string[];
  suppresses_tags: string[];
  conflicts_with_tags: string[];
  text: string;
  content_version: string;
  status: 'development' | 'reviewed' | 'published';
}

export interface SelectedContentModule {
  id: string;
  domain: ContentDomain;
  priority: number;
  assertionTags: string[];
  suppressesTags: string[];
  text: string;
  contentVersion: string;
}

export interface SuppressedContentModule {
  id: string;
  domain: ContentDomain;
  reason: 'suppressed-assertion-tag' | 'conflict-with-selected' | 'fallback-not-needed';
  blockingTags: string[];
}

export interface ContentCompositionResult {
  selected: SelectedContentModule[];
  suppressed: SuppressedContentModule[];
  selectedIds: string[];
  suppressedIds: string[];
}

export class ContentComposerError extends Error {
  constructor(
    public readonly code:
      | 'INVALID_MODULE'
      | 'DUPLICATE_MODULE_ID'
      | 'DUPLICATE_TRAIT_SCORE'
      | 'MISSING_TRAIT_SCORE',
    message: string
  ) {
    super(message);
    this.name = 'ContentComposerError';
  }
}

function validateBp(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > 10000) {
    throw new ContentComposerError('INVALID_MODULE', `${label} must be an integer in 0..10000`);
  }
}

function validateModules(modules: readonly ContentModule[]): void {
  const seen = new Set<string>();
  for (const module of modules) {
    if (!module.id?.trim()) throw new ContentComposerError('INVALID_MODULE', 'module id required');
    if (seen.has(module.id)) throw new ContentComposerError('DUPLICATE_MODULE_ID', `duplicate module ${module.id}`);
    seen.add(module.id);
    if (!module.locale?.trim()) throw new ContentComposerError('INVALID_MODULE', `${module.id}: locale required`);
    if (!Number.isSafeInteger(module.priority)) throw new ContentComposerError('INVALID_MODULE', `${module.id}: integer priority required`);
    if (!module.content_version?.trim()) throw new ContentComposerError('INVALID_MODULE', `${module.id}: content_version required`);
    if (!module.text?.trim()) throw new ContentComposerError('INVALID_MODULE', `${module.id}: text required`);
    if (!Array.isArray(module.assertion_tags) || module.assertion_tags.length === 0) {
      throw new ContentComposerError('INVALID_MODULE', `${module.id}: assertion_tags required`);
    }
    if (!Array.isArray(module.suppresses_tags) || !Array.isArray(module.conflicts_with_tags)) {
      throw new ContentComposerError('INVALID_MODULE', `${module.id}: suppression/conflict arrays required`);
    }

    const activation = module.activation;
    if (!activation || typeof activation.kind !== 'string') {
      throw new ContentComposerError('INVALID_MODULE', `${module.id}: activation required`);
    }
    if (activation.kind === 'trait_range') {
      if (activation.min_bp === undefined && activation.max_bp === undefined) {
        throw new ContentComposerError('INVALID_MODULE', `${module.id}: trait_range needs min_bp or max_bp`);
      }
      if (activation.min_bp !== undefined) validateBp(activation.min_bp, `${module.id}.min_bp`);
      if (activation.max_bp !== undefined) validateBp(activation.max_bp, `${module.id}.max_bp`);
      if (activation.min_bp !== undefined && activation.max_bp !== undefined && activation.min_bp > activation.max_bp) {
        throw new ContentComposerError('INVALID_MODULE', `${module.id}: min_bp > max_bp`);
      }
    } else if (activation.kind === 'interaction') {
      if (!/^PCS-INT-\d{3}$/.test(activation.interaction_id)) {
        throw new ContentComposerError('INVALID_MODULE', `${module.id}: invalid interaction id`);
      }
    } else if (activation.kind === 'core_code') {
      if (!Array.isArray(activation.codes) || activation.codes.length === 0) {
        throw new ContentComposerError('INVALID_MODULE', `${module.id}: core_code activation needs codes`);
      }
    } else if (activation.kind !== 'always' && activation.kind !== 'fallback') {
      throw new ContentComposerError('INVALID_MODULE', `${module.id}: unsupported activation kind`);
    }
  }
}

function buildTraitScoreMap(traitScores: readonly TraitScore[]): Map<TraitId, number> {
  const map = new Map<TraitId, number>();
  for (const score of traitScores) {
    if (map.has(score.traitId)) {
      throw new ContentComposerError('DUPLICATE_TRAIT_SCORE', `duplicate trait score ${score.traitId}`);
    }
    map.set(score.traitId, score.scoreBp);
  }
  return map;
}

function activationMatches(input: {
  module: ContentModule;
  traitScores: ReadonlyMap<TraitId, number>;
  interactions: ReadonlySet<string>;
  personalityCode: PersonalityCodeResult;
}): boolean {
  const activation = input.module.activation;
  switch (activation.kind) {
    case 'always':
      return true;
    case 'fallback':
      return true;
    case 'interaction':
      return input.interactions.has(activation.interaction_id);
    case 'core_code':
      return activation.codes.includes(input.personalityCode.coreCode);
    case 'trait_range': {
      const score = input.traitScores.get(activation.trait_id);
      if (score === undefined) {
        throw new ContentComposerError('MISSING_TRAIT_SCORE', `${input.module.id}: missing ${activation.trait_id}`);
      }
      if (activation.min_bp !== undefined && score < activation.min_bp) return false;
      if (activation.max_bp !== undefined && score > activation.max_bp) return false;
      return true;
    }
  }
}

function intersect(values: readonly string[], set: ReadonlySet<string>): string[] {
  return values.filter((value) => set.has(value));
}

export function composeContent(input: {
  locale: string;
  modules: readonly ContentModule[];
  traitScores: readonly TraitScore[];
  interactions: InteractionEvaluationResult;
  personalityCode: PersonalityCodeResult;
}): ContentCompositionResult {
  validateModules(input.modules);
  const traitScores = buildTraitScoreMap(input.traitScores);
  const activeInteractions = new Set(input.interactions.activeIds);

  const candidates = input.modules
    .filter((module) => module.locale === input.locale)
    .filter((module) => activationMatches({ module, traitScores, interactions: activeInteractions, personalityCode: input.personalityCode }))
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));

  const selected: SelectedContentModule[] = [];
  const suppressed: SuppressedContentModule[] = [];
  const assertedTags = new Set<string>();
  const suppressedTags = new Set<string>();
  const domainsWithNonFallbackSelection = new Set<ContentDomain>();

  for (const module of candidates) {
    if (module.activation.kind === 'fallback' && domainsWithNonFallbackSelection.has(module.domain)) {
      suppressed.push({ id: module.id, domain: module.domain, reason: 'fallback-not-needed', blockingTags: [] });
      continue;
    }

    const blockedAssertions = intersect(module.assertion_tags, suppressedTags);
    if (blockedAssertions.length) {
      suppressed.push({
        id: module.id,
        domain: module.domain,
        reason: 'suppressed-assertion-tag',
        blockingTags: blockedAssertions.sort()
      });
      continue;
    }

    const conflicts = intersect(module.conflicts_with_tags, assertedTags);
    if (conflicts.length) {
      suppressed.push({
        id: module.id,
        domain: module.domain,
        reason: 'conflict-with-selected',
        blockingTags: conflicts.sort()
      });
      continue;
    }

    selected.push({
      id: module.id,
      domain: module.domain,
      priority: module.priority,
      assertionTags: [...module.assertion_tags],
      suppressesTags: [...module.suppresses_tags],
      text: module.text,
      contentVersion: module.content_version
    });
    if (module.activation.kind !== 'fallback') domainsWithNonFallbackSelection.add(module.domain);
    for (const tag of module.assertion_tags) assertedTags.add(tag);
    for (const tag of module.suppresses_tags) suppressedTags.add(tag);
  }

  return {
    selected,
    suppressed,
    selectedIds: selected.map((module) => module.id),
    suppressedIds: suppressed.map((module) => module.id)
  };
}
