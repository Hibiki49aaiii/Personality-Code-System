import fs from 'node:fs';

const protocol = JSON.parse(fs.readFileSync('data/calibration/beta-protocol-v0.1-dev.json', 'utf8'));
const consent = JSON.parse(fs.readFileSync('data/calibration/consent-purpose-v0.1-dev.json', 'utf8'));
const dbRole = JSON.parse(fs.readFileSync('data/security/database-role-policy-v0.1-dev.json', 'utf8'));
const migration = fs.readFileSync('drizzle/0008_calibration_consent_receipts.sql','utf8');
const errors = [];

if (protocol.protocol_version !== 'beta-calibration-protocol-v0.1-dev') errors.push('unexpected protocol version');
if (protocol.status !== 'planning-only') errors.push('beta protocol must remain planning-only before consent/governance activation');
if (protocol.collection_enabled !== false) errors.push('calibration collection must remain disabled');
if (protocol.export_enabled !== false) errors.push('calibration export must remain disabled');
if (protocol.public_validation_claims_allowed !== false) errors.push('public validation claims must remain disabled');
if (protocol.ordinary_product_analytics_is_calibration_data !== false) errors.push('product analytics must not be treated as calibration data');

if (consent.consent_contract_version !== 'calibration-consent-contract-v0.1-dev') errors.push('unexpected calibration consent contract version');
if (consent.status !== 'draft-review-only') errors.push('calibration consent copy must remain draft before legal/research approval');
if (consent.legal_approved !== false) errors.push('calibration consent legal approval must remain false');
if (consent.collection_authorized !== false || consent.export_authorized !== false) errors.push('calibration consent contract must not authorize collection/export');
if (consent.ordinary_product_analytics_is_consent !== false) errors.push('ordinary product analytics must not constitute calibration consent');
if (consent.affirmative_action_required !== true || consent.separate_receipt_required !== true) errors.push('calibration participation must require separate affirmative consent');
if (consent.current_runtime_collection_endpoint_exists !== false || consent.current_runtime_export_job_exists !== false) errors.push('calibration runtime collection/export surface must remain absent');
if (!Array.isArray(consent.activation_blockers) || consent.activation_blockers.length < 7) errors.push('calibration consent activation blockers are incomplete');

if (!migration.includes('CREATE TABLE calibration_consent_receipts')) errors.push('separate calibration consent receipt table missing');
if (!migration.includes('calibration consent receipt model/locale must match owning session')) errors.push('calibration receipt model/locale binding guard missing');
if (!migration.includes('calibration consent receipt identity is immutable')) errors.push('calibration receipt immutable identity guard missing');
if (!migration.includes('update may only withdraw consent')) errors.push('calibration receipt withdrawal-only update guard missing');

if (JSON.stringify(dbRole.runtime_no_access_tables ?? []) !== JSON.stringify(['calibration_consent_receipts'])) {
  errors.push('runtime database role must explicitly classify calibration consent storage as no-access before activation');
}
if ((dbRole.runtime_table_privileges.calibration_consent_receipts ?? []).length !== 0) {
  errors.push('runtime database role must have zero calibration consent table privileges before activation');
}
if (fs.existsSync('src/app/api/calibration')) errors.push('runtime calibration API route must not exist before activation');

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

console.log('Beta calibration protocol validation passed: separate consent receipt persistence exists but runtime access/collection/export remain disabled; consent/legal/sample/operator/environment prerequisites and analysis/version rules stay fail-closed.');
