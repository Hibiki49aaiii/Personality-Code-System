import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const sqlPath = path.join(process.cwd(), 'drizzle', '0000_phase2b_persistence.sql');
const sqlText = await readFile(sqlPath, 'utf8');
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
  'result_snapshots'
];

for (const table of requiredTables) {
  if (!new RegExp(`CREATE TABLE\\s+${table}\\b`, 'i').test(sqlText)) {
    errors.push(`missing required table ${table}`);
  }
}

const requiredFragments = [
  ['hashed bearer token column', /access_token_hash\s+char\(64\)/i],
  ['answer range check', /value\s+BETWEEN\s+1\s+AND\s+5/i],
  ['trait basis-point check', /score_bp\s+BETWEEN\s+0\s+AND\s+10000/i],
  ['result snapshot JSONB', /snapshot_json\s+jsonb\s+NOT NULL/i],
  ['result snapshot immutable trigger', /CREATE TRIGGER\s+result_snapshots_immutable_update/i],
  ['published model immutable update trigger', /CREATE TRIGGER\s+assessment_model_release_immutable_update/i],
  ['published model immutable delete trigger', /CREATE TRIGGER\s+assessment_model_release_immutable_delete/i],
  ['restrict model references', /assessment_model_releases\(model_version\)\s+ON DELETE RESTRICT/i]
];

for (const [label, pattern] of requiredFragments) {
  if (!pattern.test(sqlText)) errors.push(`missing ${label}`);
}

if (/\baccess_token\b(?!_hash)/i.test(sqlText)) {
  errors.push('migration appears to persist a raw access_token column');
}

if (errors.length) {
  console.error(`Persistence migration validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Persistence migration validation passed: ${requiredTables.length} required tables and immutability/token constraints present.`);
