import fs from 'node:fs';
import path from 'node:path';

const policy=JSON.parse(fs.readFileSync('data/calibration/privacy-purge-policy-v0.1-dev.json','utf8'));
const governance=JSON.parse(fs.readFileSync('data/calibration/governance-policy-v0.1-dev.json','utf8'));
const protocol=JSON.parse(fs.readFileSync('data/calibration/beta-protocol-v0.1-dev.json','utf8'));
const dbPolicy=JSON.parse(fs.readFileSync('data/security/calibration-operator-db-role-policy-v0.1-dev.json','utf8'));
const runtimePolicy=JSON.parse(fs.readFileSync('data/security/database-role-policy-v0.1-dev.json','utf8'));
const inventory=JSON.parse(fs.readFileSync('data/privacy/data-inventory-v0.1-dev.json','utf8'));
const migration=fs.readFileSync('drizzle/0013_calibration_privacy_purge.sql','utf8');
const drizzle=fs.readFileSync('src/infrastructure/persistence/calibrationSchema.ts','utf8');
const grants=fs.readFileSync('ops/sql/calibration-operator-role-grants.sql','utf8');
const cli=fs.readFileSync('scripts/calibration-privacy-purge.mjs','utf8');
const lib=fs.readFileSync('scripts/lib/calibration-privacy-purge-cli.mjs','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const ci=fs.readFileSync('.github/workflows/ci.yml','utf8');
const errors=[];

if (policy.privacy_purge_policy_version!=='privacy-purge-policy-v0.1-dev') errors.push('unexpected privacy purge policy version');
if (policy.status!=='engineering-row-purge-runtime-disabled') errors.push('privacy purge policy status drift');
for (const [key,expected] of Object.entries({
  runtime_api_enabled:false,
  collection_enabled:false,
  export_enabled:false,
  raw_materializer_enabled:false,
  artifact_purge_supported:false,
  direct_table_access_allowed:false,
  requester_may_review_own_request:false,
  privacy_operator_purge_is_initial_eligibility:false,
  production_provisioning_complete:false
})) {
  if (policy[key]!==expected) errors.push(`privacy purge policy ${key} drift`);
}

if (policy.database_role!=='pcs_calibration_privacy_control') errors.push('privacy control DB role drift');
if (policy.environments?.database_url!=='PCS_CALIBRATION_PRIVACY_CONTROL_DATABASE_URL') errors.push('privacy control DB env drift');
if (policy.environments?.operator_token!=='PCS_CALIBRATION_OPERATOR_TOKEN') errors.push('privacy control operator-token env drift');
if (JSON.stringify(policy.commands)!==JSON.stringify(['request','review','confirm','reject'])) errors.push('privacy purge command set drift');
if (policy.request_role!=='calibration-privacy-operator') errors.push('privacy purge requester role drift');
if (policy.reviewer_role!=='calibration-reviewer') errors.push('privacy purge reviewer role drift');

const expectedReasons=['consent-withdrawn','owner-session-deleted','retest-pair-invalidated'];
if (JSON.stringify(policy.qualifying_reasons)!==JSON.stringify(expectedReasons)) errors.push('privacy purge qualifying reason set drift');
if (
  policy.pair_expansion?.enabled!==true
  || policy.pair_expansion?.requires_each_member_qualifying_event!==true
  || policy.pair_expansion?.purge_all_still_present_eligible_members_atomically!==true
) errors.push('privacy purge retest pair-expansion contract drift');
if (
  policy.confirmation?.revalidate_qualifying_event!==true
  || policy.confirmation?.insert_execution_marker!=='privacy-operator-purge'
  || policy.confirmation?.delete_row_level_calibration_records!==true
  || policy.confirmation?.retain_deletion_journal!==true
  || policy.confirmation?.bounded_audit_action!=='privacy-purge-confirmed'
) errors.push('privacy purge confirmation contract drift');
if (
  policy.rejection?.delete_rows!==false
  || policy.rejection?.bounded_audit_action!=='privacy-purge-rejected'
) errors.push('privacy purge rejection contract drift');
if (
  policy.future_materializer_coupling?.materializer_activation_allowed_without_artifact_lineage!==false
  || policy.future_materializer_coupling?.materializer_activation_allowed_without_artifact_purge_regeneration!==false
  || policy.future_materializer_coupling?.artifact_registry_required_when_materializer_added!==true
) errors.push('future materializer/purge coupling contract drift');

const expectedTables=[
  'calibration_privacy_purge_requests',
  'calibration_privacy_purge_request_targets'
];
for (const table of expectedTables) {
  if (!new RegExp(`CREATE TABLE public\\.${table}\\b`,'i').test(migration)) {
    errors.push(`privacy purge migration missing table ${table}`);
  }
  if (!drizzle.includes(`'${table}'`)) errors.push(`Drizzle schema missing ${table}`);
  if ((runtimePolicy.runtime_table_privileges?.[table] ?? []).length!==0) errors.push(`runtime role must have zero privileges on ${table}`);
  if (!runtimePolicy.runtime_no_access_tables?.includes(table)) errors.push(`runtime no-access table classification missing ${table}`);
}

for (const fragment of [
  "action IN (",
  "'privacy-purge-rejected'",
  'calibration_privacy_purge_requests_insert_guard',
  'calibration_privacy_purge_requests_update_guard',
  'calibration_privacy_purge_requests_delete_guard',
  'calibration_privacy_purge_targets_insert_guard',
  'calibration_privacy_purge_targets_immutable',
  'public.pcs_request_calibration_privacy_purge',
  'public.pcs_review_calibration_privacy_purge',
  'public.pcs_decide_calibration_privacy_purge',
  "r.role = 'calibration-privacy-operator'",
  "r.role = 'calibration-reviewer'",
  'calibration privacy purge self review forbidden',
  'calibration privacy purge request already decided',
  'FOR UPDATE',
  "'privacy-operator-purge'",
  'DELETE FROM public.calibration_records',
  "'privacy-purge-confirmed'",
  "'privacy-purge-rejected'",
  'REVOKE ALL ON FUNCTION public.pcs_request_calibration_privacy_purge(text,uuid) FROM PUBLIC',
  'REVOKE ALL ON FUNCTION public.pcs_review_calibration_privacy_purge(text,uuid) FROM PUBLIC',
  'REVOKE ALL ON FUNCTION public.pcs_decide_calibration_privacy_purge(text,uuid,text) FROM PUBLIC'
]) {
  if (!migration.includes(fragment)) errors.push(`privacy purge migration missing ${fragment}`);
}

for (const functionName of [
  'public.pcs_request_calibration_privacy_purge',
  'public.pcs_review_calibration_privacy_purge',
  'public.pcs_decide_calibration_privacy_purge'
]) {
  const escaped=functionName.replaceAll('.','\\.');
  const pattern=new RegExp(
    `CREATE OR REPLACE FUNCTION\\s+${escaped}[\\s\\S]*?SECURITY DEFINER[\\s\\S]*?SET search_path = pg_catalog`,
    'i'
  );
  if (!pattern.test(migration)) errors.push(`${functionName} must be SECURITY DEFINER with pg_catalog search_path`);
}

const requestFunctionStart=migration.indexOf('CREATE OR REPLACE FUNCTION public.pcs_request_calibration_privacy_purge');
const requestFunctionEnd=migration.indexOf('REVOKE ALL ON FUNCTION public.pcs_request_calibration_privacy_purge',requestFunctionStart);
const requestFunction=migration.slice(requestFunctionStart,requestFunctionEnd);
if (requestFunction.includes("e.reason IN (\n        'privacy-operator-purge'")) {
  errors.push('privacy-operator-purge must never be an initial purge eligibility reason');
}
for (const reason of ['consent-withdrawn','owner-session-deleted','retest-pair-invalidated']) {
  if (!requestFunction.includes(`'${reason}'`)) errors.push(`purge request missing qualifying reason ${reason}`);
}
if (!requestFunction.includes("'retest-pair-invalidated'")) errors.push('purge request must understand retest pair invalidation');
if (!requestFunction.includes('FROM public.calibration_retest_linkages')) errors.push('purge request must expand current retest linkage');

const privacyRole=dbPolicy.roles?.pcs_calibration_privacy_control;
if (!privacyRole) errors.push('privacy-control DB role policy missing');
if (privacyRole?.schema_create_allowed!==false) errors.push('privacy-control DB role schema CREATE must be denied');
if (Object.keys(privacyRole?.table_privileges ?? {}).length!==0) errors.push('privacy-control DB role must have zero direct table privileges');
const expectedFunctions=[
  'public.pcs_authenticate_calibration_operator(text)',
  'public.pcs_request_calibration_privacy_purge(text,uuid)',
  'public.pcs_review_calibration_privacy_purge(text,uuid)',
  'public.pcs_decide_calibration_privacy_purge(text,uuid,text)'
];
if (JSON.stringify(privacyRole?.function_execute)!==JSON.stringify(expectedFunctions)) errors.push('privacy-control function EXECUTE allowlist drift');

for (const fragment of [
  'REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM pcs_calibration_privacy_control',
  'REVOKE CREATE ON SCHEMA public FROM pcs_calibration_privacy_control',
  'GRANT EXECUTE ON FUNCTION public.pcs_authenticate_calibration_operator(text)',
  'GRANT EXECUTE ON FUNCTION public.pcs_request_calibration_privacy_purge(text,uuid)',
  'GRANT EXECUTE ON FUNCTION public.pcs_review_calibration_privacy_purge(text,uuid)',
  'GRANT EXECUTE ON FUNCTION public.pcs_decide_calibration_privacy_purge(text,uuid,text)',
  'TO pcs_calibration_privacy_control'
]) if (!grants.includes(fragment)) errors.push(`privacy-control grant template missing ${fragment}`);

const inventoryClass=inventory.classes?.find((row)=>row.id==='calibration-withdrawal-deletion-control');
if (!inventoryClass) {
  errors.push('privacy inventory purge/deletion class missing');
} else {
  for (const table of expectedTables) {
    if (!inventoryClass.tables?.includes(table)) errors.push(`privacy inventory missing ${table}`);
  }
  if (inventoryClass.row_level_purge_executor_implemented!==true) errors.push('privacy inventory row purge implementation marker missing');
  if (inventoryClass.artifact_purge_executor_implemented!==false) errors.push('privacy inventory must keep artifact purge executor false');
}

if (
  governance.implementation_status?.targeted_calibration_record_deletion_implemented!==true
  || governance.implementation_status?.row_level_purge_executor_implemented!==true
  || governance.implementation_status?.artifact_purge_executor_implemented!==false
) errors.push('calibration governance row/artifact purge implementation state drift');
if (governance.authorization?.privacy_purge_surface!=='offline-cli-execute-only-db-api') errors.push('privacy purge surface governance drift');
if (governance.authorization?.privacy_purge_policy_ref!=='data/calibration/privacy-purge-policy-v0.1-dev.json') errors.push('privacy purge policy governance reference missing');
if (!governance.activation_blockers?.includes('raw-materializer-artifact-lineage-and-purge-coupling')) errors.push('future materializer/artifact-purge coupling blocker missing');
if (governance.activation_blockers?.includes('withdrawal-offline-artifact-purge-executor')) errors.push('obsolete row-purge blocker must be removed');
if (governance.implementation_status?.raw_export_materializer_implemented!==false) errors.push('raw materializer must remain false');

if (protocol.prerequisite_engineering_status?.['retention-deletion-policy']!=='row-purge-executor-ready-artifact-purge-coupled-to-future-materializer') {
  errors.push('beta protocol retention/deletion prerequisite state drift');
}
if (
  protocol.governance_policy_foundation?.targeted_calibration_record_deletion_implemented!==true
  || protocol.governance_policy_foundation?.row_level_purge_executor_implemented!==true
  || protocol.governance_policy_foundation?.artifact_purge_executor_implemented!==false
  || protocol.governance_policy_foundation?.privacy_purge_policy_ref!=='data/calibration/privacy-purge-policy-v0.1-dev.json'
) errors.push('beta protocol purge foundation summary drift');

for (const fragment of [
  'parseCalibrationPrivacyPurgeArgs',
  'PCS_CALIBRATION_PRIVACY_CONTROL_DATABASE_URL',
  'PCS_CALIBRATION_OPERATOR_TOKEN',
  'public.pcs_request_calibration_privacy_purge',
  'public.pcs_review_calibration_privacy_purge',
  'public.pcs_decide_calibration_privacy_purge'
]) {
  if (!cli.includes(fragment) && !lib.includes(fragment) && !JSON.stringify(policy).includes(fragment)) {
    errors.push(`privacy purge CLI implementation missing ${fragment}`);
  }
}
if (!lib.includes("'--token'")) errors.push('privacy purge CLI token argv rejection missing');
for (const forbidden of [
  'calibration_item_responses',
  'assessment_answers',
  'session_id',
  'email',
  'real_name',
  'writeFileSync(',
  'createWriteStream('
]) {
  if (cli.includes(forbidden)) errors.push(`privacy purge CLI must not directly materialize/read participant payload: ${forbidden}`);
}

if (pkg.scripts?.['operator:calibration-purge']!=='node scripts/calibration-privacy-purge.mjs') errors.push('privacy purge npm operator command missing');
if (pkg.scripts?.['test:calibration-privacy-purge:integration']!=='node tests/infrastructure/calibration-privacy-purge.integration.mjs') errors.push('privacy purge integration npm command missing');
if (!pkg.scripts?.['test:domain']?.includes('tests/infrastructure/calibration-privacy-purge-cli.test.mjs')) errors.push('privacy purge CLI unit test not wired');
if (!pkg.scripts?.['validate:calibration']?.includes('validate-calibration-privacy-purge.mjs')) errors.push('privacy purge validator not wired');
if (!ci.includes('Calibration privacy purge integration') || !ci.includes('npm run test:calibration-privacy-purge:integration')) errors.push('CI privacy purge integration step missing');
if (ci.includes('PCS_CALIBRATION_PRIVACY_CONTROL_DATABASE_URL:') || ci.includes('PCS_CALIBRATION_OPERATOR_TOKEN:')) {
  errors.push('CI must not define persistent/global privacy control credentials');
}
if (fs.existsSync(path.join('src','app','api','calibration'))) errors.push('runtime calibration API must remain absent');

if (
  governance.collection_enabled!==false
  || governance.export_enabled!==false
  || protocol.collection_enabled!==false
  || protocol.export_enabled!==false
) errors.push('row purge implementation must not activate calibration collection/export');

if (errors.length) {
  console.error(`Calibration privacy purge validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Calibration privacy purge validation passed: only pre-journaled pseudonymous privacy targets can enter an execute-only two-person row purge workflow; artifact purge remains intentionally coupled to any future raw materializer and collection/export stay disabled.');
