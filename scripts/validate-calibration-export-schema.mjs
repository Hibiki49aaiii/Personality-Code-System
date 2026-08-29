import fs from 'node:fs';

const schema=JSON.parse(fs.readFileSync('data/calibration/export-schema-v0.1-dev.json','utf8'));
const consent=JSON.parse(fs.readFileSync('data/calibration/consent-purpose-v0.1-dev.json','utf8'));
const source=fs.readFileSync('src/domain/calibration/exportRecord.ts','utf8');
const tests=fs.readFileSync('tests/domain/calibration-export-record.test.ts','utf8');
const packageJson=JSON.parse(fs.readFileSync('package.json','utf8'));
const controlPolicy=JSON.parse(fs.readFileSync('data/calibration/export-control-policy-v0.1-dev.json','utf8'));
const controlCli=fs.readFileSync('scripts/calibration-export-control.mjs','utf8');
const errors=[];

if (schema.export_schema_version !== 'calibration-export-record-v0.1-dev') errors.push('unexpected calibration export schema version');
if (schema.status !== 'schema-only-runtime-export-disabled') errors.push('calibration export schema must remain schema-only before activation');
if (schema.runtime_export_enabled !== false) errors.push('runtime calibration export must remain disabled');
if (schema.third_party_auto_upload_allowed !== false) errors.push('calibration export may not auto-upload to third parties');
if (schema.consent_required !== true) errors.push('calibration export must require explicit consent');

const expectedRowFields=[
  'schemaVersion','calibrationRecordId','waveId','consentVersion','purposeId',
  'assessmentModelVersion','itemBankVersion','scoringVersion',
  'traitDictionaryVersion','locale','responses'
];
if (JSON.stringify(schema.row_fields)!==JSON.stringify(expectedRowFields)) errors.push('calibration export row field allowlist drift');
if (JSON.stringify(schema.response_fields)!==JSON.stringify(['itemId','itemRevision','value'])) errors.push('calibration response field allowlist drift');
if (JSON.stringify(schema.response_value_range)!==JSON.stringify([1,5])) errors.push('calibration response value range drift');
if (schema.max_responses_per_record !== 500) errors.push('calibration response-count bound drift');
if (schema.retest_linkage_in_v0_1 !== false || schema.demographic_fields_in_v0_1 !== false || schema.timing_fields_in_v0_1 !== false || schema.derived_scores_or_codes_in_v0_1 !== false) {
  errors.push('v0.1 calibration export must remain minimal: no retest/demographic/timing/derived output');
}

for (const key of [
  'sessionId','privateToken','accessToken','accessTokenHash','publicToken','publicTokenHash',
  'ipAddress','preciseLocation','email','realName','traitScores','traitVector','coreCode',
  'extendedCode','responseQuality','interactionActiveIds','resultProse','productAnalytics',
  'operationalLogs','freeText','retestLinkId'
]) if (!schema.forbidden_fields.includes(key)) errors.push(`missing forbidden calibration export field ${key}`);

for (const fragment of [
  "CALIBRATION_EXPORT_SCHEMA_VERSION = 'calibration-export-record-v0.1-dev'",
  "const TOP_LEVEL_KEYS = new Set([",
  "const RESPONSE_KEYS = new Set(['itemId','itemRevision','value'])",
  "value.responses.length > 500",
  "entry.value as number) < 1",
  "entry.value as number) > 5",
  "UNKNOWN_FIELD",
  "DUPLICATE_RESPONSE",
  "buildCalibrationExportManifestV01",
  "MIXED_EXPORT_SCOPE",
  "EMPTY_EXPORT",
  "validateCalibrationRecordAgainstExpectedItemsV01",
  "OFF_MODEL_RESPONSE",
  "MISSING_REQUIRED_RESPONSE"
]) if (!source.includes(fragment)) errors.push(`calibration export domain validator missing ${fragment}`);

for (const fragment of ['sessionId','accessTokenHash','coreCode','retestLinkId','responseMs','MIXED_EXPORT_SCOPE','rowCount: 2','OFF_MODEL_RESPONSE','MISSING_REQUIRED_RESPONSE']) {
  if (!tests.includes(fragment)) errors.push(`calibration export adversarial test missing ${fragment}`);
}

if (consent.collection_authorized !== false || consent.export_authorized !== false) errors.push('consent contract must not authorize export');
if (consent.current_runtime_export_job_exists !== false) errors.push('consent contract must state no runtime export job exists');
if (fs.existsSync('src/app/api/calibration')) errors.push('calibration API route must not exist before activation');

const allowedControlOnlyScripts={
  'operator:calibration-export-control':'node scripts/calibration-export-control.mjs',
  'test:calibration-export-control:integration':'node tests/infrastructure/calibration-export-control.integration.mjs'
};
for (const [name,command] of Object.entries(packageJson.scripts ?? {})) {
  if (!/calibration/i.test(name) || !/export/i.test(name)) continue;

  if (!(name in allowedControlOnlyScripts)) {
    errors.push(`raw/runtime calibration export script must not exist before activation: ${name}=${command}`);
    continue;
  }

  if (command !== allowedControlOnlyScripts[name]) {
    errors.push(`approved calibration export-control script command drift: ${name}=${command}`);
  }
}

if (
  controlPolicy.export_control_policy_version!=='calibration-export-control-policy-v0.1-dev'
  || controlPolicy.raw_export_materializer_enabled!==false
  || controlPolicy.runtime_web_surface_enabled!==false
  || controlPolicy.collection_enabled!==false
  || controlPolicy.export_enabled!==false
) {
  errors.push('calibration export-control tooling must remain control-only with raw materialization/runtime export disabled');
}
for (const forbiddenFragment of [
  'writeFileSync(',
  'createWriteStream(',
  'assessment_answers',
  'calibration_record_links',
  'responses:'
]) {
  if (controlCli.includes(forbiddenFragment)) {
    errors.push(`calibration export-control CLI must not materialize/read raw calibration data: ${forbiddenFragment}`);
  }
}

if (errors.length) {
  console.error(`Calibration export schema validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Calibration export schema validation passed: strict offline row allowlist is frozen; approved request/review/decision control tooling is separated from raw materialization, and no runtime export route/job is enabled.');
