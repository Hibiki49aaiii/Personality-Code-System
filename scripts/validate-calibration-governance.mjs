import fs from 'node:fs';

const policy=JSON.parse(fs.readFileSync('data/calibration/governance-policy-v0.1-dev.json','utf8'));
const protocol=JSON.parse(fs.readFileSync('data/calibration/beta-protocol-v0.1-dev.json','utf8'));
const consent=JSON.parse(fs.readFileSync('data/calibration/consent-purpose-v0.1-dev.json','utf8'));
const exportSchema=JSON.parse(fs.readFileSync('data/calibration/export-schema-v0.1-dev.json','utf8'));
const dbRole=JSON.parse(fs.readFileSync('data/security/database-role-policy-v0.1-dev.json','utf8'));
const operatorAuth=JSON.parse(fs.readFileSync('data/calibration/operator-auth-policy-v0.1-dev.json','utf8'));
const errors=[];

if (policy.governance_policy_version !== 'calibration-governance-policy-v0.1-dev') errors.push('unexpected calibration governance policy version');
if (policy.status !== 'engineering-policy-ready-runtime-disabled') errors.push('governance policy status drift');
if (policy.legal_approved !== false) errors.push('governance policy must not claim legal approval');
if (policy.collection_enabled !== false || policy.export_enabled !== false) errors.push('calibration collection/export must remain disabled');
if (policy.runtime_operator_surface_enabled !== false) errors.push('runtime operator surface must remain disabled');
if (policy.ordinary_application_runtime_role_access_allowed !== false) errors.push('ordinary runtime role must not access calibration operator/export surfaces');
if (policy.third_party_auto_upload_allowed !== false || exportSchema.third_party_auto_upload_allowed !== false) errors.push('third-party automatic calibration upload must remain prohibited');

const rowRetention=policy.retention?.row_level_calibration_artifact;
if (rowRetention?.max_days_after_wave_close !== 180) errors.push('row-level calibration retention ceiling must remain 180 days in v0.1');
if (rowRetention?.withdrawal_or_self_deletion_overrides_time_retention !== true) errors.push('withdrawal/self-deletion must override time retention');
if (rowRetention?.next_analysis_requires_withdrawn_records_removed !== true) errors.push('withdrawn records must be removed before next analysis');
if (rowRetention?.offline_artifact_regeneration_required_after_withdrawal !== true) errors.push('offline artifacts must be purgeable/regenerable after withdrawal');
if (rowRetention?.backup_restore_requires_withdrawal_replay_before_active_research_use !== true) errors.push('restores must replay withdrawal/deletion state');

const aggregate=policy.retention?.aggregate_reproducibility_artifact;
if (aggregate?.row_level_responses_allowed !== false || aggregate?.participant_linkage_allowed !== false || aggregate?.reidentification_material_allowed !== false) {
  errors.push('long-lived aggregate evidence must not contain row-level/linkage/reidentification data');
}
if (policy.retention?.operator_audit_metadata?.retention_days !== 365) errors.push('operator audit metadata retention baseline must remain 365 days');
if (policy.retention?.operator_audit_metadata?.participant_diagnostic_payload_allowed !== false) errors.push('operator audit must not contain participant diagnostic payload');

const expectedRoles=[
  'calibration-export-requester',
  'calibration-export-approver',
  'calibration-privacy-operator',
  'calibration-reviewer'
];
if (JSON.stringify(policy.authorization?.roles) !== JSON.stringify(expectedRoles)) errors.push('calibration operator role set drift');
if (policy.authorization?.raw_export_requires_two_person_review !== true) errors.push('raw calibration export must require two-person review');
if (policy.authorization?.requester_and_approver_must_differ !== true) errors.push('raw export requester/approver must differ');
if (policy.authorization?.explicit_scope_tuple_required !== true) errors.push('raw export exact scope tuple required');
if (policy.authorization?.purpose_or_reason_code_required !== true) errors.push('raw export purpose/reason code required');
if (policy.authorization?.browser_or_public_api_raw_export_allowed !== false) errors.push('browser/public API raw export must remain prohibited');
if (policy.authorization?.application_runtime_db_role_may_export !== false) errors.push('application runtime role must not export calibration data');
if (policy.authorization?.approval_before_materialization_required !== true) errors.push('raw export approval must precede materialization');

const audit=policy.audit_contract;
if (audit?.storage_implemented !== true) errors.push('append-only calibration operator audit storage must be implemented');
if (audit?.append_only_required !== true) errors.push('future audit storage must be append-only');
if (audit?.artifact_digest_algorithm !== 'sha256') errors.push('calibration artifact digest must be SHA-256');
const requiredAuditFields=[
  'auditEventId','action','requesterOperatorId','approverOperatorId','purposeCode','waveId','exportSchemaVersion',
  'consentVersion','assessmentModelVersion','itemBankVersion','scoringVersion','traitDictionaryVersion','locale',
  'rowCount','artifactSha256','occurredAt','disposition'
];
if (JSON.stringify(audit?.required_fields) !== JSON.stringify(requiredAuditFields)) errors.push('operator audit required-field contract drift');

const requiredForbidden=[
  'responses','itemResponses','sessionId','privateToken','privateTokenHash','publicToken','publicTokenHash','ipAddress',
  'preciseLocation','email','realName','traitScores','traitVector','coreCode','extendedCode','responseQuality','resultProse','freeText'
];
for (const field of requiredForbidden) if (!audit?.forbidden_fields?.includes(field)) errors.push(`operator audit forbidden field missing: ${field}`);
if (audit?.free_form_participant_data_allowed !== false) errors.push('free-form participant data must not enter audit');

const withdrawal=policy.withdrawal_and_deletion;
if (withdrawal?.deletion_queue_implemented !== false) errors.push('offline artifact deletion/purge executor must remain unimplemented');
if (withdrawal?.record_linkage_and_deletion_journal_implemented !== true) errors.push('pseudonymous calibration record linkage/deletion journal must be implemented');
if (withdrawal?.export_regeneration_or_purge_required !== true) errors.push('withdrawal must require export purge/regeneration');
if (withdrawal?.active_analysis_use_blocked_until_purge !== true) errors.push('active analysis use must block until withdrawal purge');
if (withdrawal?.owner_session_deletion_must_remove_consent_receipt !== true) errors.push('owner deletion must remove consent receipt');
if (withdrawal?.future_row_level_linkage_must_support_targeted_deletion !== true) errors.push('future row-level linkage must support targeted deletion');
if (withdrawal?.restore_must_not_reactivate_withdrawn_records !== true) errors.push('restore must not reactivate withdrawn records');

const impl=policy.implementation_status;
if (impl?.retention_policy_ready !== true || impl?.operator_authorization_policy_ready !== true) errors.push('governance policy readiness flags incomplete');
if (impl?.operator_authentication_implemented !== true) errors.push('offline operator authentication tooling implementation missing');
if (impl?.production_operator_provisioning_complete !== false) errors.push('production operator provisioning must remain pending');
if (impl?.operator_audit_storage_implemented !== true) errors.push('append-only operator audit storage implementation missing');
if (impl?.export_control_workflow_implemented !== true) errors.push('offline export control workflow implementation missing');
if (impl?.answer_level_calibration_storage_schema_implemented !== true) errors.push('answer-level calibration storage schema implementation missing');
if (impl?.calibration_ingest_surface_implemented !== false) errors.push('calibration ingest surface must remain disabled');
if (impl?.raw_export_materializer_implemented !== false) errors.push('raw export materializer must remain pending');
if (impl?.targeted_calibration_record_linkage_and_journal_implemented !== true) errors.push('targeted calibration record linkage/deletion journal foundation missing');
if (impl?.targeted_calibration_record_deletion_implemented !== false) errors.push('offline artifact targeted purge executor must remain pending');

if (protocol.prerequisite_engineering_status?.['retention-deletion-policy'] !== 'policy-and-deletion-journal-ready-purge-executor-pending') {
  errors.push('beta protocol retention/deletion prerequisite status drift');
}
if (protocol.prerequisite_engineering_status?.['operator-authorization-audit'] !== 'control-workflow-implemented-runtime-disabled-production-provisioning-pending') {
  errors.push('beta protocol operator authorization/audit prerequisite status drift');
}
if (consent.legal_approved !== false || consent.collection_authorized !== false || consent.export_authorized !== false) {
  errors.push('consent contract must remain non-authorizing');
}
if (operatorAuth.operator_auth_policy_version !== 'calibration-operator-auth-policy-v0.1-dev') {
  errors.push('operator auth policy reference invalid');
}
if (operatorAuth.production_provisioning_complete !== false) {
  errors.push('operator auth policy must not claim production provisioning complete');
}
if (policy.authorization?.operator_auth_surface !== 'offline-cli-only') {
  errors.push('calibration operator authentication surface must remain offline CLI only');
}
if (policy.authorization?.operator_auth_policy_ref !== 'data/calibration/operator-auth-policy-v0.1-dev.json') {
  errors.push('calibration operator auth policy reference missing');
}
if (policy.authorization?.export_control_surface !== 'offline-cli-execute-only-db-api') {
  errors.push('calibration export control surface drift');
}
if (policy.authorization?.export_control_policy_ref !== 'data/calibration/export-control-policy-v0.1-dev.json') {
  errors.push('calibration export control policy reference missing');
}
if (policy.activation_blockers?.includes('operator-authentication-command-and-role-binding')) {
  errors.push('obsolete operator authentication implementation blocker must be removed');
}
if (!policy.activation_blockers?.includes('operator-production-provisioning-evidence')) {
  errors.push('production operator provisioning evidence blocker missing');
}
if (policy.version_scope_freeze?.implemented !== true
  || policy.version_scope_freeze?.ref !== 'data/calibration/beta-wave-ja-01-scope-freeze-v0.1-dev.json'
  || policy.version_scope_freeze?.external_preregistration_complete !== false) {
  errors.push('repository version-scope freeze governance state drift');
}
if (policy.activation_blockers?.includes('frozen-version-scope')) {
  errors.push('satisfied governance scope-freeze blocker must be removed');
}
const operatorPlaneTables=[
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
for (const table of operatorPlaneTables) {
  if (dbRole.runtime_no_access_tables?.includes(table) !== true) errors.push(`runtime role no-access classification missing for ${table}`);
  if ((dbRole.runtime_table_privileges?.[table] ?? []).length !== 0) errors.push(`runtime privileges must remain empty for ${table}`);
}
if (fs.existsSync('src/app/api/calibration')) errors.push('runtime calibration API route must not exist while governance implementation is pending');

if (!fs.existsSync('docs/model/CALIBRATION_GOVERNANCE_POLICY_v0.1.md')) errors.push('human-readable calibration governance document missing');

if (errors.length) {
  console.error(`Calibration governance validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Calibration governance validation passed: retention/deletion, fail-closed answer storage, operator authentication and offline two-person export-control/audit are implemented, while runtime ingest, legal approval, production operator provisioning, raw export materialization and offline artifact purge remain fail-closed.');
