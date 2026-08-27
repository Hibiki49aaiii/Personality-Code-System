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
  'rate_limit_buckets'
];

for (const table of requiredTables) {
  if (!new RegExp(`CREATE TABLE\\s+${table}\\b`, 'i').test(sqlText)) {
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
  ['restrict model references', /assessment_model_releases\(model_version\)\s+ON DELETE RESTRICT/i],
  ['rate limit HMAC bucket hash', /bucket_hash\s+char\(64\)/i],
  ['rate limit count check', /request_count\s+integer\s+NOT NULL[\s\S]*request_count\s+>=\s+1/i],
  ['rate limit expiry index', /CREATE INDEX\s+rate_limit_buckets_expires_idx/i]
];

for (const [label, pattern] of requiredFragments) {
  if (!pattern.test(sqlText)) errors.push(`missing ${label}`);
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
