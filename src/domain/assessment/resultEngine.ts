import {
  scoreAssessment,
  type AssessmentAnswer,
  type AssessmentScoreResult,
  type ScoringItem
} from './scoring';
import {
  generatePersonalityCode,
  type CoreCodeSchema,
  type PersonalityCodeResult
} from './personalityCode';
import {
  evaluateInteractionRules,
  type InteractionEvaluationResult,
  type InteractionRuleSet
} from './interactions';
import {
  composeContent,
  type ContentCompositionResult,
  type ContentDomain,
  type ContentModule
} from './contentComposer';

export const REQUIRED_RESULT_DOMAINS: readonly ContentDomain[] = [
  'core-identity',
  'trait-overview',
  'thinking',
  'emotion',
  'action',
  'relationships-love',
  'work',
  'stress',
  'communication',
  'decision-making',
  'learning',
  'leadership-derived',
  'risk',
  'creativity',
  'hidden-strengths',
  'adversarial',
  'growth',
  'personal-manual'
] as const;

export interface ResultVersionSet {
  resultSchemaVersion: string;
  assessmentModelVersion: string;
  itemBankVersion: string;
  scoringVersion: string;
  codeSchemaVersion: string;
  interactionVersion: string;
  contentVersion: string;
}

export interface ResultSection {
  domain: ContentDomain;
  moduleIds: string[];
  texts: string[];
}

export interface StructuredAssessmentResult {
  versions: ResultVersionSet;
  locale: string;
  scoring: AssessmentScoreResult;
  personalityCode: PersonalityCodeResult;
  interactions: InteractionEvaluationResult;
  content: ContentCompositionResult;
  sections: ResultSection[];
}

export class ResultEngineError extends Error {
  constructor(
    public readonly code:
      | 'VERSION_MISMATCH'
      | 'MISSING_REQUIRED_DOMAIN'
      | 'DUPLICATE_CONTENT_VERSION',
    message: string
  ) {
    super(message);
    this.name = 'ResultEngineError';
  }
}

function assertVersion(expected: string, actual: string, label: string): void {
  if (expected !== actual) {
    throw new ResultEngineError(
      'VERSION_MISMATCH',
      `${label} mismatch: expected ${expected}, got ${actual}`
    );
  }
}

function validateContentVersion(modules: readonly ContentModule[], expected: string): void {
  for (const module of modules) {
    if (module.content_version !== expected) {
      throw new ResultEngineError(
        'DUPLICATE_CONTENT_VERSION',
        `content module ${module.id} has ${module.content_version}, expected ${expected}`
      );
    }
  }
}

function buildSections(content: ContentCompositionResult): ResultSection[] {
  const byDomain = new Map<ContentDomain, { moduleIds: string[]; texts: string[] }>();
  for (const domain of REQUIRED_RESULT_DOMAINS) {
    byDomain.set(domain, { moduleIds: [], texts: [] });
  }
  for (const module of content.selected) {
    const bucket = byDomain.get(module.domain);
    if (!bucket) continue;
    bucket.moduleIds.push(module.id);
    bucket.texts.push(module.text);
  }
  return REQUIRED_RESULT_DOMAINS.map((domain) => {
    const bucket = byDomain.get(domain)!;
    if (bucket.moduleIds.length === 0) {
      throw new ResultEngineError(
        'MISSING_REQUIRED_DOMAIN',
        `no selected content module for required domain ${domain}`
      );
    }
    return { domain, moduleIds: bucket.moduleIds, texts: bucket.texts };
  });
}

export function buildStructuredAssessmentResult(input: {
  versions: ResultVersionSet;
  locale: string;
  scoringItems: readonly ScoringItem[];
  answers: readonly AssessmentAnswer[];
  codeSchema: CoreCodeSchema;
  interactionRules: InteractionRuleSet;
  contentModules: readonly ContentModule[];
}): StructuredAssessmentResult {
  assertVersion(input.versions.codeSchemaVersion, input.codeSchema.code_schema_version, 'code schema');
  assertVersion(input.versions.interactionVersion, input.interactionRules.interaction_version, 'interaction rules');
  validateContentVersion(input.contentModules, input.versions.contentVersion);

  const scoring = scoreAssessment({
    scoringVersion: input.versions.scoringVersion,
    items: input.scoringItems,
    answers: input.answers
  });
  const personalityCode = generatePersonalityCode(scoring.traitScores, input.codeSchema);
  const interactions = evaluateInteractionRules(scoring.traitScores, input.interactionRules);
  const content = composeContent({
    locale: input.locale,
    modules: input.contentModules,
    traitScores: scoring.traitScores,
    interactions,
    personalityCode
  });
  const sections = buildSections(content);

  return {
    versions: { ...input.versions },
    locale: input.locale,
    scoring,
    personalityCode,
    interactions,
    content,
    sections
  };
}
