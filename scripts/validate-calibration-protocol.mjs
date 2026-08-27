import fs from 'node:fs';

const protocol = JSON.parse(fs.readFileSync('data/calibration/beta-protocol-v0.1-dev.json', 'utf8'));
const errors = [];

if (protocol.protocol_version !== 'beta-calibration-protocol-v0.1-dev') errors.push('unexpected protocol version');
if (protocol.status !== 'planning-only') errors.push('beta protocol must remain planning-only before consent/governance activation');
if (protocol.collection_enabled !== false) errors.push('calibration collection must remain disabled');
if (protocol.export_enabled !== false) errors.push('calibration export must remain disabled');
if (protocol.public_validation_claims_allowed !== false) errors.push('public validation claims must remain disabled');
if (protocol.ordinary_product_analytics_is_calibration_data !== false) errors.push('product analytics must not be treated as calibration data');

const requiredPrerequisites = [
  'explicit-calibration-consent-state',
  'versioned-consent-purpose',
  'legal-privacy-approval',
  'production-environment-separation',
  'retention-deletion-policy',
  'operator-authorization-audit',
  'pre-registered-sample-plan',
  'frozen-analysis-version-scope'
];
for (const item of requiredPrerequisites) {
  if (!protocol.activation_prerequisites.includes(item)) errors.push(`missing activation prerequisite ${item}`);
}

const requiredAnalyses = [
  'item-distributions-floor-ceiling',
  'item-total-scale-behavior',
  'internal-consistency-omega',
  'inter-trait-redundancy',
  'test-retest-stability',
  'exploratory-factor-review',
  'item-removal-rewording-ledger'
];
for (const item of requiredAnalyses) {
  if (!protocol.planned_analysis_modules.includes(item)) errors.push(`missing planned analysis ${item}`);
}

if (protocol.sample_plan.fixed_universal_minimum_n !== null) {
  errors.push('do not encode a universal sample-size magic number before the analysis-specific plan is preregistered');
}
if (protocol.decision_policy.single_statistic_can_promote_stage !== false) {
  errors.push('a single statistic must never promote the evidence stage');
}
if (protocol.decision_policy.marketing_type_count_can_override_measurement_evidence !== false) {
  errors.push('marketing type count must never override measurement evidence');
}
if (protocol.decision_policy.changes_require_new_model_or_item_revision !== true) {
  errors.push('beta-driven changes must be versioned');
}

if (errors.length) {
  console.error(`Beta calibration protocol validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Beta calibration protocol validation passed: collection/export/validation claims remain disabled; prerequisites, analysis bundle, retest/sample planning, and versioned decision rules are frozen before activation.');
