import type { ObservedTypeDistribution } from './observedTypeDistribution';

export interface ObservedDistributionPublicationPolicy {
  policy_version: string;
  status: string;
  population_claim_allowed: false;
  required_model_status: 'published';
  require_public_code_schema: true;
  minimum_scope_sample_size: number;
  minimum_code_count: number;
  display_percentage_decimals: number;
  insufficient_sample_label_ja: string;
  required_display_scope_fields: string[];
  prohibited_copy_patterns: string[];
  note: string;
}

export interface ObservedDistributionPublicationContext {
  modelStatus: 'draft' | 'beta' | 'published' | 'retired';
  codeSchemaPublicUse: boolean;
}

export type ObservedDistributionPublicationDecision =
  | { publishable: false; reason: 'model-not-published' | 'code-schema-not-public' | 'scope-sample-too-small' }
  | { publishable: true; reason: 'eligible' };

export function evaluateObservedDistributionPublication(
  distribution: ObservedTypeDistribution,
  context: ObservedDistributionPublicationContext,
  policy: ObservedDistributionPublicationPolicy
): ObservedDistributionPublicationDecision {
  if (policy.population_claim_allowed !== false) throw new Error('Observed distribution policy must prohibit population claims');
  if (context.modelStatus !== policy.required_model_status) return { publishable: false, reason: 'model-not-published' };
  if (policy.require_public_code_schema && !context.codeSchemaPublicUse) return { publishable: false, reason: 'code-schema-not-public' };
  if (distribution.sampleSize < policy.minimum_scope_sample_size) return { publishable: false, reason: 'scope-sample-too-small' };
  return { publishable: true, reason: 'eligible' };
}

export function observedCodeDisplay(
  distribution: ObservedTypeDistribution,
  coreCode: string,
  decision: ObservedDistributionPublicationDecision,
  policy: ObservedDistributionPublicationPolicy
): { available: false; labelJa: string } | { available: true; count: number; percentageText: string } {
  if (!decision.publishable) return { available: false, labelJa: policy.insufficient_sample_label_ja };
  const entry = distribution.entries.find((candidate) => candidate.coreCode === coreCode);
  if (!entry || entry.count < policy.minimum_code_count) return { available: false, labelJa: policy.insufficient_sample_label_ja };
  const percentage = entry.shareBp / 100;
  return { available: true, count: entry.count, percentageText: `${percentage.toFixed(policy.display_percentage_decimals)}%` };
}

export function formatObservedCodeScopeStatement(input: {
  distribution: ObservedTypeDistribution;
  coreCode: string;
  percentageText: string;
}): string {
  const { distribution, coreCode, percentageText } = input;
  return `PCS ${distribution.scope.assessmentModelVersion} / ${distribution.scope.locale} の ${distribution.scope.startInclusive} から ${distribution.scope.endExclusive} までに完了した ${distribution.sampleSize.toLocaleString('ja-JP')} 件の対象診断のうち、${coreCode} は ${percentageText} でした。`; 
}
