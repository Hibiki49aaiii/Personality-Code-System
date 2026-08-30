import fs from 'node:fs';

const protocol = JSON.parse(fs.readFileSync('data/calibration/beta-protocol-v0.1-dev.json', 'utf8'));
const consent = JSON.parse(fs.readFileSync('data/calibration/consent-purpose-v0.1-dev.json', 'utf8'));
const dbRole = JSON.parse(fs.readFileSync('data/security/database-role-policy-v0.1-dev.json', 'utf8'));
const migration = fs.readFileSync('drizzle/0008_calibration_consent_receipts.sql','utf8');
const answerStorageMigration = fs.readFileSync('drizzle/0011_calibration_answer_storage.sql','utf8');
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
const expectedConsentBlockers=[
  'final-consent-copy-review',
  'legal-privacy-approval',
  'calibration-retention-deletion-policy',
  'operator-production-provisioning-evidence',
  'pre-registered-sample-plan',
  'production-environment-separation'
];
for (const blocker of expectedConsentBlockers) {
  if (!consent.activation_blockers?.includes(blocker)) errors.push(`calibration consent activation blocker missing ${blocker}`);
}
if (consent.activation_blockers?.includes('frozen-analysis-version-scope')) errors.push('satisfied consent scope-freeze blocker must be removed');

if (!migration.includes('CREATE TABLE calibration_consent_receipts')) errors.push('separate calibration consent receipt table missing');
if (!migration.includes('calibration consent receipt model/locale must match owning session')) errors.push('calibration receipt model/locale binding guard missing');
if (!migration.includes('calibration consent receipt identity is immutable')) errors.push('calibration receipt immutable identity guard missing');
if (!migration.includes('update may only withdraw consent')) errors.push('calibration receipt withdrawal-only update guard missing');
for (const fragment of [
  'CREATE TABLE public.calibration_records',
  'CREATE TABLE public.calibration_item_responses',
  'calibration_records_insert_guard',
  'calibration_item_responses_insert_guard',
  'pcs_finalize_calibration_record',
  'REVOKE ALL ON FUNCTION public.pcs_finalize_calibration_record(uuid) FROM PUBLIC'
]) {
  if (!answerStorageMigration.includes(fragment)) errors.push(`calibration answer storage migration missing ${fragment}`);
}

const expectedCalibrationNoAccess=[
  'calibration_consent_receipts',
  'calibration_operators',
  'calibration_operator_roles',
  'calibration_export_requests',
  'calibration_operator_audit_events',
  'calibration_record_links',
  'calibration_deletion_events',
  'calibration_records',
  'calibration_item_responses'
];
for (const table of expectedCalibrationNoAccess) {
  if (!(dbRole.runtime_no_access_tables ?? []).includes(table)) {
    errors.push(`runtime database role must classify ${table} as no-access before activation`);
  }
  if ((dbRole.runtime_table_privileges?.[table] ?? []).length !== 0) {
    errors.push(`runtime database role must have zero privileges on ${table} before activation`);
  }
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

const expectedPrerequisiteStatus = {
  'explicit-calibration-consent-state': 'foundation-ready-runtime-write-disabled',
  'versioned-consent-purpose': 'draft-contract-ready-not-approved',
  'legal-privacy-approval': 'pending-external',
  'production-environment-separation': 'pending-external',
  'retention-deletion-policy': 'policy-and-deletion-journal-ready-purge-executor-pending',
  'operator-authorization-audit': 'control-workflow-implemented-runtime-disabled-production-provisioning-pending',
  'pre-registered-sample-plan': 'registration-ready-candidate-not-preregistered',
  'frozen-analysis-version-scope': 'repository-frozen-not-preregistered'
};
for (const [key,value] of Object.entries(expectedPrerequisiteStatus)) {
  if (protocol.prerequisite_engineering_status?.[key] !== value) errors.push(`prerequisite status drift for ${key}`);
}

const expectedWavePlanRef = 'data/calibration/beta-wave-ja-01-draft.json';
const waveFoundation = protocol.wave_plan_foundation;
if (waveFoundation?.plan_ref !== expectedWavePlanRef) {
  errors.push('beta protocol wave plan reference drift');
} else if (!fs.existsSync(expectedWavePlanRef)) {
  errors.push('beta protocol wave plan reference does not exist');
} else {
  const wavePlan = JSON.parse(fs.readFileSync(expectedWavePlanRef, 'utf8'));

  if (waveFoundation.wave_id !== wavePlan.wave_id) errors.push('beta protocol/wave id drift');
  if (waveFoundation.candidate_assessment_model_version !== wavePlan.version_scope?.assessment_model_version) {
    errors.push('beta protocol/wave candidate assessment model drift');
  }
  if (waveFoundation.registration_ready !== true || wavePlan.registration_ready !== true || wavePlan.status !== 'registration-ready-not-preregistered') {
    errors.push('beta protocol/wave must expose registration-ready candidate state');
  }
  if (waveFoundation.preregistered !== false || wavePlan.sample_size_plan?.preregistered !== false) {
    errors.push('beta protocol/wave must remain not preregistered');
  }
  if (waveFoundation.version_scope_frozen !== true || wavePlan.version_scope_frozen !== true) {
    errors.push('beta protocol/wave repository version scope must remain frozen');
  }
  if (waveFoundation.scope_freeze_ref !== 'data/calibration/beta-wave-ja-01-scope-freeze-v0.1-dev.json'
    || wavePlan.scope_freeze_ref !== waveFoundation.scope_freeze_ref) {
    errors.push('beta protocol/wave scope-freeze reference drift');
  }
  if (waveFoundation.scope_freeze_aggregate_sha256 !== wavePlan.scope_freeze_aggregate_sha256
    || !/^[a-f0-9]{64}$/.test(waveFoundation.scope_freeze_aggregate_sha256 ?? '')) {
    errors.push('beta protocol/wave scope-freeze aggregate drift');
  }
  if (waveFoundation.collection_start_allowed !== false || wavePlan.collection_start_allowed !== false) {
    errors.push('beta protocol/wave collection start must remain disabled');
  }
}
if (protocol.governance_policy_foundation?.policy_ref !== 'data/calibration/governance-policy-v0.1-dev.json') errors.push('calibration governance policy reference missing');
if (protocol.governance_policy_foundation?.retention_policy_ready !== true
  || protocol.governance_policy_foundation?.operator_authorization_policy_ready !== true) {
  errors.push('calibration governance policy readiness summary incomplete');
}
if (protocol.governance_policy_foundation?.legal_approved !== false) errors.push('calibration legal approval must remain pending');
if (protocol.governance_policy_foundation?.operator_authentication_implemented !== true) errors.push('operator-facing authentication tooling implementation missing');
if (protocol.governance_policy_foundation?.production_operator_provisioning_complete !== false) errors.push('production operator provisioning must remain pending');
if (protocol.governance_policy_foundation?.operator_auth_policy_ref !== 'data/calibration/operator-auth-policy-v0.1-dev.json') errors.push('operator auth policy reference missing from protocol foundation');
if (protocol.governance_policy_foundation?.operator_audit_storage_implemented !== true) errors.push('operator audit storage foundation missing');
if (protocol.governance_policy_foundation?.export_control_workflow_implemented !== true) errors.push('offline export control workflow foundation missing');
if (protocol.governance_policy_foundation?.export_control_policy_ref !== 'data/calibration/export-control-policy-v0.1-dev.json') errors.push('export control policy reference missing from protocol foundation');
if (protocol.governance_policy_foundation?.answer_level_calibration_storage_schema_implemented !== true) {
  errors.push('answer-level calibration storage schema foundation missing');
}
if (protocol.governance_policy_foundation?.calibration_ingest_surface_implemented !== false) {
  errors.push('calibration ingest surface must remain disabled');
}
if (protocol.governance_policy_foundation?.raw_export_materializer_implemented !== false) errors.push('raw export materializer must remain pending');
if (protocol.governance_policy_foundation?.targeted_calibration_record_linkage_and_journal_implemented !== true) errors.push('targeted record linkage/deletion journal foundation missing');
if (protocol.governance_policy_foundation?.targeted_calibration_record_deletion_implemented !== false) errors.push('offline artifact purge executor must remain pending');

if (protocol.consent_storage_foundation?.table !== 'calibration_consent_receipts') errors.push('calibration consent storage table status missing');
if (protocol.consent_storage_foundation?.runtime_role_access_allowed !== false) errors.push('runtime consent access must remain disabled');
if (protocol.consent_storage_foundation?.owner_session_cascade_delete !== true) errors.push('consent receipt must remain owner-session deletable');
if (protocol.consent_storage_foundation?.answer_level_calibration_storage_schema_implemented !== true) {
  errors.push('answer-level calibration storage schema must be implemented');
}
if (JSON.stringify(protocol.consent_storage_foundation?.answer_storage_tables)!==JSON.stringify([
  'calibration_records',
  'calibration_item_responses'
])) {
  errors.push('answer-level calibration storage table contract drift');
}
if (protocol.consent_storage_foundation?.finalize_function !== 'pcs_finalize_calibration_record') {
  errors.push('calibration finalize function contract drift');
}
if (protocol.consent_storage_foundation?.runtime_answer_ingest_enabled !== false) {
  errors.push('runtime calibration answer ingest must remain disabled');
}
if (protocol.consent_storage_foundation?.answer_level_calibration_rows_exist !== false) errors.push('answer-level calibration dataset must not exist before activation');

if (protocol.export_schema_foundation?.export_schema_version !== 'calibration-export-record-v0.1-dev') errors.push('offline calibration export schema foundation missing');
if (protocol.export_schema_foundation?.runtime_export_enabled !== false) errors.push('runtime export must remain disabled in protocol');
if (protocol.export_schema_foundation?.strict_allowlist !== true || protocol.export_schema_foundation?.exact_scope_manifest !== true) errors.push('calibration export schema must retain strict allowlist and exact-scope manifest');
for (const key of ['retest_linkage_included','demographic_fields_included','timing_fields_included','derived_scores_or_codes_included']) {
  if (protocol.export_schema_foundation?.[key] !== false) errors.push(`calibration export v0.1 must keep ${key}=false`);
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
  errors.push('do not encode a universal sample-size magic number');
}
if (protocol.sample_plan.status !== 'registration-ready-candidate-not-preregistered'
  || protocol.sample_plan.candidate_target_n !== 1000
  || protocol.sample_plan.candidate_minimum_primary_analysis_n !== 800
  || protocol.sample_plan.candidate_recruitment_window_days !== 56) {
  errors.push('registration-ready Wave 01 sample-plan summary drift');
}
if (protocol.retest_plan.status !== 'registration-ready-candidate-not-activated'
  || protocol.retest_plan.candidate_interval_days_min !== 14
  || protocol.retest_plan.candidate_interval_days_max !== 21
  || protocol.retest_plan.candidate_target_completed_n !== 200
  || protocol.retest_plan.candidate_minimum_interpretable_n !== 150
  || protocol.retest_plan.linkage_implemented !== false) {
  errors.push('registration-ready Wave 01 retest-plan summary drift');
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

console.log('Beta calibration protocol validation passed: consent and fail-closed answer-storage schemas exist while runtime ingest/collection/export remain disabled; consent/legal/sample/operator-provisioning/environment prerequisites and analysis/version rules stay fail-closed.');
