import fs from 'node:fs';
import path from 'node:path';

const policy=JSON.parse(fs.readFileSync('data/calibration/retest-linkage-policy-v0.1-dev.json','utf8'));
const consent=JSON.parse(fs.readFileSync('data/calibration/retest-consent-purpose-v0.1-dev.json','utf8'));
const schema=JSON.parse(fs.readFileSync('data/calibration/export-schema-v0.2-retest-dev.json','utf8'));
const baselineSchema=JSON.parse(fs.readFileSync('data/calibration/export-schema-v0.1-dev.json','utf8'));
const wave=JSON.parse(fs.readFileSync('data/calibration/beta-wave-ja-01-draft.json','utf8'));
const freeze=JSON.parse(fs.readFileSync('data/calibration/beta-wave-ja-01-scope-freeze-v0.1-dev.json','utf8'));
const governance=JSON.parse(fs.readFileSync('data/calibration/governance-policy-v0.1-dev.json','utf8'));
const dbRole=JSON.parse(fs.readFileSync('data/security/database-role-policy-v0.1-dev.json','utf8'));
const inventory=JSON.parse(fs.readFileSync('data/privacy/data-inventory-v0.1-dev.json','utf8'));
const migration=fs.readFileSync('drizzle/0012_calibration_retest_linkage.sql','utf8');
const answerStorageMigration=fs.readFileSync('drizzle/0011_calibration_answer_storage.sql','utf8');
const credential=fs.readFileSync('src/infrastructure/persistence/calibrationRetestCredential.ts','utf8');
const domain=fs.readFileSync('src/domain/calibration/retestExportRecord.ts','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const ci=fs.readFileSync('.github/workflows/ci.yml','utf8');
const errors=[];

if (policy.retest_linkage_policy_version!=='calibration-retest-linkage-policy-v0.1-dev') {
  errors.push('unexpected retest linkage policy version');
}
if (policy.status!=='engineering-foundation-runtime-disabled') errors.push('retest linkage policy status drift');
for (const key of [
  'runtime_issue_or_claim_api_enabled','collection_enabled','export_enabled','materializer_enabled',
  'external_preregistered','final_consent_approved','production_provisioning_complete'
]) {
  if (policy[key]!==false) errors.push(`retest linkage activation flag must remain false: ${key}`);
}
if (
  policy.token?.entropy_bytes!==32
  || policy.token?.encoding!=='base64url'
  || policy.token?.canonical_length!==43
  || policy.token?.hash_algorithm!=='sha256'
) {
  errors.push('retest credential format drift');
}
for (const key of [
  'raw_token_database_storage_allowed','raw_token_argv_allowed','raw_token_stdout_allowed','token_hash_export_allowed'
]) {
  if (policy.token?.[key]!==false) errors.push(`retest token privacy flag must remain false: ${key}`);
}
if (
  policy.pair?.eligible_interval_days_min!==14
  || policy.pair?.eligible_interval_days_max!==21
  || policy.pair?.baseline_required!==true
  || policy.pair?.retest_optional_until_claim!==true
  || policy.pair?.baseline_retest_must_differ!==true
  || policy.pair?.baseline_unique!==true
  || policy.pair?.retest_unique_when_claimed!==true
  || policy.pair?.exact_same_wave_model_scope_required!==true
) {
  errors.push('retest pair contract drift');
}
if (
  policy.measurement_record_source?.table!=='calibration_records'
  || policy.measurement_record_source?.baseline_status_required!=='complete'
  || policy.measurement_record_source?.retest_status_required!=='complete'
  || policy.measurement_record_source?.completion_timestamp_source!=='calibration_records.completed_at'
  || policy.answer_storage_migration_ref!=='drizzle/0011_calibration_answer_storage.sql'
  || policy.retest_linkage_migration_ref!=='drizzle/0012_calibration_retest_linkage.sql'
) {
  errors.push('retest measurement-record source contract drift');
}

const expectedScope={
  assessment_model_version:'assessment-dev-v0.3',
  item_bank_version:'item-bank-v0.2',
  scoring_version:'scoring-v0.1-dev',
  trait_dictionary_version:'trait-dictionary-v0.2',
  locale:'ja-JP'
};
if (JSON.stringify(policy.exact_scope)!==JSON.stringify(expectedScope)) errors.push('retest exact scope drift');
if (
  wave.wave_id!==policy.wave_id
  || wave.version_scope?.assessment_model_version!==policy.exact_scope.assessment_model_version
  || wave.version_scope?.item_bank_version!==policy.exact_scope.item_bank_version
  || wave.version_scope?.scoring_version!==policy.exact_scope.scoring_version
  || wave.version_scope?.trait_dictionary_version!==policy.exact_scope.trait_dictionary_version
  || wave.locale!==policy.exact_scope.locale
) {
  errors.push('retest policy/Wave scope mismatch');
}
if (
  wave.version_scope_frozen!==true
  || freeze.status!=='repository-frozen-not-preregistered'
  || freeze.external_preregistered!==false
) {
  errors.push('retest foundation must bind repository-frozen but unregistered Wave JA-01');
}
if (
  wave.retest_plan?.linkage_status!=='engineering-foundation-implemented-runtime-disabled'
  || wave.retest_plan?.linkage_policy_ref!=='data/calibration/retest-linkage-policy-v0.1-dev.json'
  || wave.retest_plan?.candidate_export_schema_ref!=='data/calibration/export-schema-v0.2-retest-dev.json'
  || wave.retest_plan?.draft_consent_ref!=='data/calibration/retest-consent-purpose-v0.1-dev.json'
  || wave.retest_plan?.runtime_issue_or_claim_api_enabled!==false
) {
  errors.push('Wave retest linkage implementation/non-activation state drift');
}
if (wave.activation_blockers?.includes('retest-linkage-schema-and-consent')) {
  errors.push('obsolete retest linkage foundation blocker must be removed');
}
for (const blocker of ['retest-consent-final-approval','runtime-retest-issue-and-claim-surface']) {
  if (!wave.activation_blockers?.includes(blocker)) errors.push(`Wave retest activation blocker missing ${blocker}`);
}

if (
  consent.consent_contract_version!=='calibration-retest-consent-contract-v0.1-dev'
  || consent.consent_version!=='calibration-retest-consent-ja-v0.1-dev'
  || consent.purpose_id!=='psychometric-calibration-retest-v0.1'
  || consent.status!=='draft-review-only'
) {
  errors.push('retest consent identity drift');
}
if (
  consent.legal_approved!==false
  || consent.collection_authorized!==false
  || consent.export_authorized!==false
  || consent.direct_identity_or_contact_required!==false
  || consent.retest_linkage_optional!==true
  || consent.affirmative_action_required!==true
  || consent.separate_receipt_required!==true
) {
  errors.push('retest consent must remain optional/draft/non-authorizing');
}
for (const field of [
  'real-name','email-or-phone','private-session-bearer-or-hash','public-share-token-or-hash',
  'retest-claim-token-or-hash-in-export','ip-address','precise-location','free-text',
  'derived-trait-scores-or-core-codes','demographics'
]) {
  if (!consent.draft_disclosure?.excluded_by_default?.includes(field)) {
    errors.push(`retest consent exclusion missing ${field}`);
  }
}

if (
  schema.export_schema_version!=='calibration-export-record-v0.2-retest-dev'
  || schema.status!=='candidate-schema-only-runtime-export-disabled'
  || schema.candidate_only!==true
  || schema.runtime_export_enabled!==false
  || schema.materializer_enabled!==false
  || schema.third_party_auto_upload_allowed!==false
) {
  errors.push('candidate retest export schema activation boundary drift');
}
const expectedConsentContract={
  baseline_consent_version:'calibration-consent-ja-v0.1-dev',
  baseline_purpose_id:'psychometric-calibration-v0.1',
  retest_consent_version:'calibration-retest-consent-ja-v0.1-dev',
  retest_purpose_id:'psychometric-calibration-retest-v0.1',
  measurement_occasion_must_match_consent_purpose:true
};
if (JSON.stringify(schema.consent_contract)!==JSON.stringify(expectedConsentContract)) {
  errors.push('candidate retest baseline/retest consent contract drift');
}
if (baselineSchema.export_schema_version!=='calibration-export-record-v0.1-dev' || baselineSchema.runtime_export_enabled!==false) {
  errors.push('baseline export v0.1 identity/disabled state drift');
}
const expectedRowFields=[
  'schemaVersion','calibrationRecordId','waveId','consentVersion','purposeId',
  'assessmentModelVersion','itemBankVersion','scoringVersion','traitDictionaryVersion',
  'locale','measurementOccasion','retestPairId','responses'
];
if (JSON.stringify(schema.row_fields)!==JSON.stringify(expectedRowFields)) errors.push('candidate retest row allowlist drift');
if (JSON.stringify(schema.measurement_occasion_values)!==JSON.stringify(['baseline','retest'])) {
  errors.push('candidate measurement occasion allowlist drift');
}
for (const forbidden of [
  'sessionId','privateToken','accessToken','accessTokenHash','publicToken','publicTokenHash',
  'retestClaimToken','retestClaimTokenHash','operatorToken','operatorTokenHash','operatorId',
  'ipAddress','preciseLocation','email','phone','realName','traitScores','traitVector',
  'coreCode','extendedCode','resultProse','productAnalytics','operationalLogs','freeText','demographics'
]) {
  if (!schema.forbidden_fields?.includes(forbidden)) errors.push(`candidate retest forbidden field missing ${forbidden}`);
}

for (const fragment of [
  'CREATE TABLE public.calibration_retest_linkages',
  'REFERENCES public.calibration_records(calibration_record_id) ON DELETE CASCADE',
  'claim_token_hash char(64) NOT NULL',
  "CHECK (claim_token_hash ~ '^[a-f0-9]{64}$')",
  'calibration_retest_linkages_baseline_uq',
  'calibration_retest_linkages_retest_uq',
  "status IN ('issued','claimed','invalidated')",
  "eligible_until = eligible_from + interval '7 days'",
  "NEW.eligible_from <> baseline_completed_at + interval '14 days'",
  "NEW.eligible_until <> baseline_completed_at + interval '21 days'",
  "baseline_status IS DISTINCT FROM 'complete'",
  "baseline_consent_version IS DISTINCT FROM 'calibration-consent-ja-v0.1-dev'",
  "baseline_purpose_id IS DISTINCT FROM 'psychometric-calibration-v0.1'",
  "retest_status IS DISTINCT FROM 'complete'",
  "retest_consent_version IS DISTINCT FROM 'calibration-retest-consent-ja-v0.1-dev'",
  "retest_purpose_id IS DISTINCT FROM 'psychometric-calibration-retest-v0.1'",
  'calibration retest completion outside eligibility window',
  'calibration_retest_consent_withdrawal_invalidation',
  'calibration_retest_record_delete_journal',
  "'retest-pair-invalidated'"
]) {
  if (!migration.includes(fragment)) errors.push(`retest migration missing ${fragment}`);
}
if ((migration.match(/SET search_path = pg_catalog/g) ?? []).length<6) {
  errors.push('retest/answer-storage override functions must lock search_path');
}
for (const fragment of [
  "consent_version = 'calibration-consent-ja-v0.1-dev'",
  "consent_purpose = 'psychometric-calibration-v0.1'",
  "consent_version = 'calibration-retest-consent-ja-v0.1-dev'",
  "consent_purpose = 'psychometric-calibration-retest-v0.1'",
  'CREATE OR REPLACE FUNCTION public.pcs_validate_calibration_record_insert()',
  'CREATE OR REPLACE FUNCTION public.pcs_assert_calibration_record_ready_to_complete('
]) {
  if (!migration.includes(fragment)) errors.push(`retest migration missing answer-storage dual-consent extension ${fragment}`);
}
if (!answerStorageMigration.includes("'consent-withdrawn'") || !answerStorageMigration.includes("'privacy-operator-purge'")) {
  errors.push('baseline answer-storage privacy deletion contract missing');
}
if (/reason IN \([\s\S]*'retest-pair-invalidated'[\s\S]*\)[\s\S]*calibration record deletion requires/i.test(answerStorageMigration)) {
  errors.push('retest-pair-invalidated must not independently authorize calibration record deletion');
}
if (/\bFROM\s+calibration_/i.test(migration) || /\bJOIN\s+calibration_/i.test(migration) || /\bUPDATE\s+calibration_/i.test(migration)) {
  errors.push('retest trigger functions must schema-qualify calibration objects');
}

for (const fragment of [
  'randomBytes(CALIBRATION_RETEST_TOKEN_BYTES).toString(\'base64url\')',
  "createHash('sha256')",
  'timingSafeEqual',
  'CALIBRATION_RETEST_TOKEN_LENGTH = 43'
]) {
  if (!credential.includes(fragment)) errors.push(`retest credential primitive missing ${fragment}`);
}

for (const fragment of [
  "CALIBRATION_RETEST_EXPORT_SCHEMA_VERSION =",
  "'calibration-export-record-v0.2-retest-dev'",
  "'measurementOccasion'",
  "'retestPairId'",
  'buildCalibrationRetestPairV02',
  'PAIR_OCCASIONS',
  'MIXED_RETEST_PAIR',
  'PAIR_RECORD_ID_COLLISION',
  'MIXED_EXPORT_SCOPE',
  'CONSENT_OCCASION_MISMATCH'
]) {
  if (!domain.includes(fragment)) errors.push(`candidate retest domain validator missing ${fragment}`);
}

if ((dbRole.runtime_table_privileges?.calibration_retest_linkages ?? null)?.length!==0) {
  errors.push('runtime DB role must have zero retest-linkage privileges');
}
if (!dbRole.runtime_no_access_tables?.includes('calibration_retest_linkages')) {
  errors.push('runtime no-access list missing retest linkage table');
}
if (dbRole.runtime_table_privileges?.calibration_records?.length!==0
  || dbRole.runtime_table_privileges?.calibration_item_responses?.length!==0) {
  errors.push('retest foundation must keep calibration answer storage runtime-inaccessible');
}
const inventoryClass=inventory.classes?.find((entry)=>entry.id==='calibration-retest-linkage');
if (
  !inventoryClass
  || inventoryClass.collection_enabled!==false
  || inventoryClass.runtime_access_allowed!==false
  || inventoryClass.direct_identity_or_contact_stored!==false
  || inventoryClass.raw_claim_token_stored!==false
  || JSON.stringify(inventoryClass.tables)!==JSON.stringify(['calibration_retest_linkages'])
) {
  errors.push('privacy inventory retest linkage class missing/drifted');
}

if (governance.collection_enabled!==false || governance.export_enabled!==false) {
  errors.push('calibration governance collection/export must remain disabled');
}
if (
  governance.implementation_status?.retest_linkage_foundation_implemented!==true
  || governance.implementation_status?.runtime_retest_issue_claim_surface_implemented!==false
  || governance.implementation_status?.retest_consent_draft_implemented!==true
  || governance.implementation_status?.retest_candidate_export_schema_implemented!==true
  || governance.withdrawal_and_deletion?.retest_pair_invalidation_journal_implemented!==true
) {
  errors.push('calibration governance retest implementation/non-activation state drift');
}
if (
  governance.retest_linkage?.policy_ref!=='data/calibration/retest-linkage-policy-v0.1-dev.json'
  || governance.retest_linkage?.candidate_export_schema_ref!=='data/calibration/export-schema-v0.2-retest-dev.json'
  || governance.retest_linkage?.draft_consent_ref!=='data/calibration/retest-consent-purpose-v0.1-dev.json'
  || governance.retest_linkage?.runtime_enabled!==false
  || governance.retest_linkage?.production_provisioning_complete!==false
) {
  errors.push('calibration governance retest linkage references drift');
}
if (wave.collection_enabled!==false || wave.export_enabled!==false || wave.collection_start_allowed!==false) {
  errors.push('Wave collection/export/start must remain disabled');
}
if (wave.sample_size_plan?.preregistered!==false || wave.preregistration_document_ref!==null) {
  errors.push('Wave must remain not externally preregistered');
}
if (fs.existsSync(path.join('src','app','api','calibration'))) {
  errors.push('runtime calibration API must remain absent');
}

if (pkg.scripts?.['validate:calibration-retest-linkage']!=='node scripts/validate-calibration-retest-linkage.mjs') {
  errors.push('retest linkage validator npm command missing');
}
if (!pkg.scripts?.['test:domain']?.includes('.tmp-tests/tests/domain/calibration-retest-export-record.test.js')) {
  errors.push('retest export unit test not wired');
}
if (!pkg.scripts?.['test:domain']?.includes('.tmp-tests/tests/infrastructure/calibration-retest-credential.test.js')) {
  errors.push('retest credential unit test not wired');
}
if (pkg.scripts?.['test:calibration-retest-linkage:integration']!=='node tests/infrastructure/calibration-retest-linkage.integration.mjs') {
  errors.push('retest PostgreSQL integration npm command missing');
}
if (!ci.includes('Calibration retest linkage integration')
  || !ci.includes('npm run test:calibration-retest-linkage:integration')) {
  errors.push('CI retest linkage integration step missing');
}

if (errors.length) {
  console.error(`Calibration retest linkage validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Calibration retest linkage validation passed: completed calibration-record pairing, hash-only pseudonymous claim identity, dual consent, 14-21 day window and pair deletion journaling are fixed while runtime issuance/claim, materialization, collection/export, preregistration and legal approval remain disabled.');
