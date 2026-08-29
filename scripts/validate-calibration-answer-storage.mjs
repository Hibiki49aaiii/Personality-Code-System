import fs from 'node:fs';
import path from 'node:path';

const protocol=JSON.parse(fs.readFileSync('data/calibration/beta-protocol-v0.1-dev.json','utf8'));
const governance=JSON.parse(fs.readFileSync('data/calibration/governance-policy-v0.1-dev.json','utf8'));
const dbRole=JSON.parse(fs.readFileSync('data/security/database-role-policy-v0.1-dev.json','utf8'));
const inventory=JSON.parse(fs.readFileSync('data/privacy/data-inventory-v0.1-dev.json','utf8'));
const migration=fs.readFileSync('drizzle/0011_calibration_answer_storage.sql','utf8');
const drizzleSchema=fs.readFileSync('src/infrastructure/persistence/calibrationSchema.ts','utf8');
const runtimeGrants=fs.readFileSync('ops/sql/runtime-role-grants.sql','utf8');
const operatorGrants=fs.readFileSync('ops/sql/calibration-operator-role-grants.sql','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const ci=fs.readFileSync('.github/workflows/ci.yml','utf8');
const errors=[];

for (const fragment of [
  'CREATE TABLE public.calibration_records',
  'CREATE TABLE public.calibration_item_responses',
  'REFERENCES public.calibration_record_links(calibration_record_id) ON DELETE CASCADE',
  'REFERENCES public.calibration_records(calibration_record_id) ON DELETE CASCADE',
  'calibration_item_response_value_chk',
  'calibration_records_insert_guard',
  'calibration_item_responses_insert_guard',
  'calibration_item_responses_update_guard',
  'calibration_item_responses_delete_guard',
  'calibration_records_delete_guard',
  'public.pcs_finalize_calibration_record',
  'SECURITY DEFINER',
  'SET search_path = pg_catalog',
  'REVOKE ALL ON FUNCTION public.pcs_finalize_calibration_record(uuid) FROM PUBLIC',
  "NEW.wave_id <> 'beta-ja-wave-01-draft'",
  "NEW.assessment_model_version <> 'assessment-dev-v0.3'",
  "NEW.item_bank_version <> 'item-bank-v0.2'",
  "NEW.scoring_version <> 'scoring-v0.1-dev'",
  "NEW.trait_dictionary_version <> 'trait-dictionary-v0.2'",
  "NEW.locale <> 'ja-JP'",
  "consent_version IS DISTINCT FROM 'calibration-consent-ja-v0.1-dev'",
  "consent_purpose IS DISTINCT FROM 'psychometric-calibration-v0.1'",
  'FROM public.assessment_model_items m',
  'expected_count <> 147'
]) {
  if (!migration.includes(fragment)) errors.push(`answer-storage migration missing ${fragment}`);
}

for (const fragment of [
  "export const calibrationRecords = pgTable(",
  "'calibration_records'",
  "export const calibrationItemResponses = pgTable(",
  "'calibration_item_responses'",
  "references(() => calibrationRecordLinks.calibrationRecordId, { onDelete: 'cascade' })",
  "references(() => calibrationRecords.calibrationRecordId, { onDelete: 'cascade' })",
  "calibration_item_response_value_chk"
]) {
  if (!drizzleSchema.includes(fragment)) errors.push(`Drizzle calibration schema missing ${fragment}`);
}

const forbiddenFieldPatterns=[
  /\bsession_id\b/i,
  /\baccess_token(?:_hash)?\b/i,
  /\bpublic_token(?:_hash)?\b/i,
  /\bip_address\b/i,
  /\bprecise_location\b/i,
  /\bemail\b/i,
  /\breal_name\b/i,
  /\bfree_text\b/i,
  /\btrait_scores?\b/i,
  /\bcore_code\b/i,
  /\bextended_code\b/i,
  /\bresult_prose\b/i,
  /\bsnapshot_json\b/i
];
for (const pattern of forbiddenFieldPatterns) {
  if (pattern.test(migration)) errors.push(`answer-storage migration contains forbidden field pattern ${pattern}`);
}

for (const table of ['calibration_records','calibration_item_responses']) {
  if ((dbRole.runtime_table_privileges?.[table] ?? []).length!==0) {
    errors.push(`runtime role must have zero ${table} privileges`);
  }
  if (!dbRole.runtime_no_access_tables?.includes(table)) {
    errors.push(`runtime no-access classification missing ${table}`);
  }
  if (runtimeGrants.includes(table)) {
    errors.push(`runtime grant template must not grant ${table}`);
  }
  if (operatorGrants.includes(`ON TABLE ${table}`) || operatorGrants.includes(`,\n  ${table}`)) {
    errors.push(`operator grant template must not directly grant ${table}`);
  }
}

const storageClass=inventory.classes?.find((row)=>row.id==='calibration-answer-storage');
if (!storageClass
  || storageClass.collection_enabled!==false
  || storageClass.runtime_access_allowed!==false
  || storageClass.derived_scores_or_codes_stored!==false
  || JSON.stringify(storageClass.tables)!==JSON.stringify(['calibration_records','calibration_item_responses'])) {
  errors.push('privacy inventory calibration-answer-storage class drift');
}

if (protocol.consent_storage_foundation?.answer_level_calibration_storage_schema_implemented!==true) {
  errors.push('protocol answer-storage schema flag missing');
}
if (protocol.consent_storage_foundation?.answer_level_calibration_rows_exist!==false) {
  errors.push('protocol must not claim calibration rows exist');
}
if (protocol.consent_storage_foundation?.runtime_answer_ingest_enabled!==false) {
  errors.push('runtime answer ingest must remain disabled');
}
if (governance.implementation_status?.answer_level_calibration_storage_schema_implemented!==true) {
  errors.push('governance answer-storage schema flag missing');
}
if (governance.implementation_status?.calibration_ingest_surface_implemented!==false) {
  errors.push('governance ingest surface must remain disabled');
}
if (
  governance.collection_enabled!==false
  || governance.export_enabled!==false
  || protocol.collection_enabled!==false
  || protocol.export_enabled!==false
) {
  errors.push('answer storage foundation must not enable collection/export');
}
if (governance.implementation_status?.raw_export_materializer_implemented!==false) {
  errors.push('raw export materializer must remain absent');
}
if (governance.implementation_status?.targeted_calibration_record_deletion_implemented!==false) {
  errors.push('targeted purge executor must remain absent');
}

if (fs.existsSync(path.join('src','app','api','calibration'))) {
  errors.push('runtime calibration API must remain absent');
}
if (pkg.scripts?.['test:calibration-answer-storage:integration']!=='node tests/infrastructure/calibration-answer-storage.integration.mjs') {
  errors.push('calibration answer-storage integration npm script missing');
}
if (!pkg.scripts?.['validate:calibration']?.includes('validate-calibration-answer-storage.mjs')) {
  errors.push('answer-storage validator not wired into validate:calibration');
}
if (!ci.includes('Calibration answer storage integration')
  || !ci.includes('npm run test:calibration-answer-storage:integration')) {
  errors.push('CI answer-storage integration step missing');
}

if (errors.length) {
  console.error(`Calibration answer storage validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Calibration answer storage validation passed: normalized exact-Wave schema exists with no runtime/operator grants, no derived/identity payload, no ingest API, and collection/export remain disabled.');
