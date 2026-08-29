import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const migrationDir = path.join(process.cwd(), 'drizzle');
const migrationFiles = (await readdir(migrationDir))
  .filter((file) => /^\d+_.*\.sql$/i.test(file))
  .sort();

if (migrationFiles.length === 0) {
  console.error('Persistence migration validation failed: no SQL migrations found.');
  process.exit(1);
}

const migrationEntries = await Promise.all(
  migrationFiles.map(async (file) => ({
    file,
    text: await readFile(path.join(migrationDir, file), 'utf8')
  }))
);
const sqlText = migrationEntries.map((entry) => entry.text).join('\n\n');
const errors = [];

const requiredTables = [
  'trait_definitions',
  'trait_definition_revisions',
  'assessment_items',
  'assessment_item_revisions',
  'assessment_model_releases',
  'assessment_model_items',
  'content_versions',
  'content_modules',
  'illustration_assets',
  'anonymous_sessions',
  'assessment_answers',
  'assessment_trait_scores',
  'result_snapshots',
  'public_share_snapshots',
  'product_events',
  'rate_limit_buckets',
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

for (const table of requiredTables) {
  if (!new RegExp(`CREATE TABLE\\s+(?:public\\.)?${table}\\b`, 'i').test(sqlText)) {
    errors.push(`missing required table ${table}`);
  }
}

const requiredFragments = [
  ['hashed bearer token column', /access_token_hash\s+char\(64\)/i],
  ['hashed public share token column', /public_token_hash\s+char\(64\)/i],
  ['answer range check', /value\s+BETWEEN\s+1\s+AND\s+5/i],
  ['trait basis-point check', /score_bp\s+BETWEEN\s+0\s+AND\s+10000/i],
  ['result snapshot JSONB', /snapshot_json\s+jsonb\s+NOT NULL/i],
  ['public share JSONB', /share_json\s+jsonb\s+NOT NULL/i],
  ['result snapshot immutable update trigger', /CREATE TRIGGER\s+result_snapshots_immutable_update/i],
  ['result snapshot version guard', /CREATE TRIGGER\s+result_snapshots_version_guard/i],
  ['public share insert/privacy guard', /CREATE TRIGGER\s+public_share_snapshots_insert_guard/i],
  ['public share immutable/revocation guard', /CREATE TRIGGER\s+public_share_snapshots_update_guard/i],
  ['public share auto-revoke on private deletion', /CREATE TRIGGER\s+result_snapshots_revoke_public_shares_before_delete/i],
  ['public share source lookup index', /CREATE INDEX\s+public_share_snapshots_source_idx/i],
  ['public share source detach on private deletion', /source_result_snapshot_id\s+uuid\s+REFERENCES\s+result_snapshots\(snapshot_id\)\s+ON DELETE SET NULL/i],
  ['public share prohibited diagnostic field guard', /public share snapshot contains a prohibited diagnostic\/private field/i],
  ['published model immutable update trigger', /CREATE TRIGGER\s+assessment_model_release_immutable_update/i],
  ['published model immutable delete trigger', /CREATE TRIGGER\s+assessment_model_release_immutable_delete/i],
  ['published model item guard', /CREATE TRIGGER\s+assessment_model_items_published_guard/i],
  ['published content module guard', /CREATE TRIGGER\s+content_modules_published_guard/i],
  ['item revision immutability', /CREATE TRIGGER\s+assessment_item_revisions_immutable/i],
  ['trait revision immutability', /CREATE TRIGGER\s+trait_definition_revisions_immutable/i],
  ['answer session/model guard', /CREATE TRIGGER\s+assessment_answers_session_model_guard/i],
  ['trait-score session/model guard', /CREATE TRIGGER\s+assessment_trait_scores_session_model_guard/i],
  ['session completion guard', /CREATE TRIGGER\s+anonymous_sessions_completion_guard/i],
  ['result illustration asset linkage guard', /CREATE TRIGGER\s+result_snapshots_asset_linkage_guard/i],
  ['public share illustration asset linkage guard', /CREATE TRIGGER\s+public_share_snapshots_asset_linkage_guard/i],
  ['restrict model references', /assessment_model_releases\(model_version\)\s+ON DELETE RESTRICT/i],
  ['rate limit HMAC bucket hash', /bucket_hash\s+char\(64\)/i],
  ['rate limit count check', /request_count\s+integer\s+NOT NULL[\s\S]*request_count\s+>=\s+1/i],
  ['rate limit expiry index', /CREATE INDEX\s+rate_limit_buckets_expires_idx/i],
  ['completed raw-answer retention window guard', /session_completed_at\s*<=\s*now\(\)\s*-\s*interval\s*'90 days'/i],
  ['calibration consent receipt guard', /CREATE TRIGGER\s+calibration_consent_receipts_guard/i],
  ['calibration consent session-model guard', /calibration consent receipt model\/locale must match owning session/i],
  ['calibration consent withdrawal-only update guard', /update may only withdraw consent/i],
  ['calibration operator hash-only credential check', /calibration_operator_credential_hash_chk/i],
  ['calibration operator update guard', /CREATE TRIGGER\s+calibration_operators_update_guard/i],
  ['calibration operator delete guard', /CREATE TRIGGER\s+calibration_operators_delete_guard/i],
  ['calibration export request delete guard', /CREATE TRIGGER\s+calibration_export_requests_delete_guard/i],
  ['calibration record link granted-consent insert guard', /CREATE TRIGGER\s+calibration_record_links_insert_guard/i],
  ['calibration record link parent-only delete guard', /CREATE TRIGGER\s+calibration_record_links_delete_guard/i],
  ['calibration consent owner-session delete-only guard', /calibration consent receipt may only delete with owner session/i],
  ['calibration export distinct approver check', /calibration_export_request_distinct_operators_chk/i],
  ['calibration export request insert role guard', /CREATE TRIGGER\s+calibration_export_requests_insert_guard/i],
  ['calibration active operator role function', /pcs_require_active_calibration_operator_role/i],
  ['calibration export request update guard', /CREATE TRIGGER\s+calibration_export_requests_update_guard/i],
  ['calibration operator audit append-only guard', /CREATE TRIGGER\s+calibration_operator_audit_events_append_only/i],
  ['calibration record link immutable guard', /CREATE TRIGGER\s+calibration_record_links_immutable_update/i],
  ['calibration consent withdrawal deletion journal trigger', /CREATE TRIGGER\s+calibration_consent_withdrawal_deletion_event/i],
  ['calibration consent delete deletion journal trigger', /CREATE TRIGGER\s+calibration_consent_delete_deletion_event/i],
  ['calibration deletion journal append-only guard', /CREATE TRIGGER\s+calibration_deletion_events_append_only/i],
  ['calibration auth security definer function', /CREATE OR REPLACE FUNCTION\s+public\.pcs_authenticate_calibration_operator[\s\S]*SECURITY DEFINER[\s\S]*SET search_path = pg_catalog/i],
  ['calibration export request security definer function', /CREATE OR REPLACE FUNCTION\s+public\.pcs_request_calibration_export[\s\S]*SECURITY DEFINER[\s\S]*SET search_path = pg_catalog/i],
  ['calibration export review security definer function', /CREATE OR REPLACE FUNCTION\s+public\.pcs_review_calibration_export_request[\s\S]*SECURITY DEFINER[\s\S]*SET search_path = pg_catalog/i],
  ['calibration export decision security definer function', /CREATE OR REPLACE FUNCTION\s+public\.pcs_decide_calibration_export_request[\s\S]*SECURITY DEFINER[\s\S]*SET search_path = pg_catalog/i],
  ['calibration control function public execute revoked', /REVOKE ALL ON FUNCTION\s+public\.pcs_decide_calibration_export_request\(text,uuid,text\) FROM PUBLIC/i],
  ['calibration answer record table', /CREATE TABLE\s+public\.calibration_records/i],
  ['calibration item response table', /CREATE TABLE\s+public\.calibration_item_responses/i],
  ['calibration record exact-scope insert guard', /CREATE TRIGGER\s+calibration_records_insert_guard/i],
  ['calibration item model-binding insert guard', /CREATE TRIGGER\s+calibration_item_responses_insert_guard/i],
  ['calibration answer value guard', /calibration_item_response_value_chk/i],
  ['calibration answer immutable update guard', /CREATE TRIGGER\s+calibration_item_responses_update_guard/i],
  ['calibration answer parent-only delete guard', /CREATE TRIGGER\s+calibration_item_responses_delete_guard/i],
  ['calibration record parent-only delete guard', /CREATE TRIGGER\s+calibration_records_delete_guard/i],
  ['calibration finalize security definer', /CREATE OR REPLACE FUNCTION\s+public\.pcs_finalize_calibration_record[\s\S]*SECURITY DEFINER[\s\S]*SET search_path = pg_catalog/i],
  ['calibration finalize public execute revoked', /REVOKE ALL ON FUNCTION\s+public\.pcs_finalize_calibration_record\(uuid\) FROM PUBLIC/i],
  ['calibration exact 147 response completion', /expected_count\s*<>\s*147/i],
  ['beta model item mapping immutability', /items belonging to a beta assessment model are immutable/i],
  ['calibration consent row serialization', /FOR UPDATE OF c/i],
  ['calibration response release tuple recheck', /calibration response release tuple mismatch/i],
  ['calibration finalize release tuple recheck', /calibration record completion release tuple mismatch/i]
];

for (const [label, pattern] of requiredFragments) {
  if (!pattern.test(sqlText)) errors.push(`missing ${label}`);
}

const privacyCascadeGuards = sqlText.match(
  /IF\s+TG_OP\s*=\s*'DELETE'\s+AND\s+session_status\s+IS\s+NULL\s+THEN/gi
) ?? [];
if (privacyCascadeGuards.length < 2) {
  errors.push('missing privacy cascade delete parent-absence guards for answers and trait scores');
}

if (/\baccess_token\b(?!_hash)/i.test(sqlText)) {
  errors.push('migration appears to persist a raw access_token column');
}
if (/\bpublic_token\b(?!_hash)/i.test(sqlText)) {
  errors.push('migration appears to persist a raw public_token column');
}
if (/public_share_snapshots_active_source_uq/i.test(sqlText)) {
  errors.push('public share migration must not force one active link per result when raw public tokens are hash-only');
}

const calibrationStorageMigration = migrationEntries.find(
  (entry) => entry.file === '0011_calibration_answer_storage.sql'
)?.text ?? '';
for (const forbidden of [
  /\bsession_id\b/i,
  /\baccess_token(?:_hash)?\b/i,
  /\bpublic_token(?:_hash)?\b/i,
  /\bip_address\b/i,
  /\bprecise_location\b/i,
  /\bemail\b/i,
  /\breal_name\b/i,
  /\btrait_scores?\b/i,
  /\bcore_code\b/i,
  /\bextended_code\b/i,
  /\bresult_prose\b/i,
  /\bfree_text\b/i
]) {
  if (forbidden.test(calibrationStorageMigration)) {
    errors.push(`calibration answer storage contains forbidden identity/derived field pattern ${forbidden}`);
  }
}

for (const entry of migrationEntries) {
  if (!/^BEGIN;[\s\S]*COMMIT;\s*$/i.test(entry.text.trim())) {
    errors.push(`${entry.file} must be an explicit BEGIN/COMMIT migration`);
  }
}

if (errors.length) {
  console.error(`Persistence migration validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Persistence migration validation passed: ${migrationFiles.length} migration(s), ${requiredTables.length} tables, private-result/public-share privacy guards, and published/session/snapshot invariants present.`
);
