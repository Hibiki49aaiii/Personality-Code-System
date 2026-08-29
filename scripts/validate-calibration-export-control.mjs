import fs from 'node:fs';
import path from 'node:path';

const policy=JSON.parse(fs.readFileSync('data/calibration/export-control-policy-v0.1-dev.json','utf8'));
const authPolicy=JSON.parse(fs.readFileSync('data/calibration/operator-auth-policy-v0.1-dev.json','utf8'));
const dbPolicy=JSON.parse(fs.readFileSync('data/security/calibration-operator-db-role-policy-v0.1-dev.json','utf8'));
const governance=JSON.parse(fs.readFileSync('data/calibration/governance-policy-v0.1-dev.json','utf8'));
const protocol=JSON.parse(fs.readFileSync('data/calibration/beta-protocol-v0.1-dev.json','utf8'));
const wave=JSON.parse(fs.readFileSync('data/calibration/beta-wave-ja-01-draft.json','utf8'));
const freeze=JSON.parse(fs.readFileSync('data/calibration/beta-wave-ja-01-scope-freeze-v0.1-dev.json','utf8'));
const consent=JSON.parse(fs.readFileSync('data/calibration/consent-purpose-v0.1-dev.json','utf8'));
const exportSchema=JSON.parse(fs.readFileSync('data/calibration/export-schema-v0.1-dev.json','utf8'));
const migration=fs.readFileSync('drizzle/0010_calibration_export_control.sql','utf8');
const grants=fs.readFileSync('ops/sql/calibration-operator-role-grants.sql','utf8');
const cli=fs.readFileSync('scripts/calibration-export-control.mjs','utf8');
const lib=fs.readFileSync('scripts/lib/calibration-export-control-cli.mjs','utf8');
const operatorCli=fs.readFileSync('scripts/calibration-operator.mjs','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const ci=fs.readFileSync('.github/workflows/ci.yml','utf8');
const errors=[];

if (policy.export_control_policy_version!=='calibration-export-control-policy-v0.1-dev') errors.push('unexpected export control policy version');
if (policy.status!=='engineering-implemented-runtime-materializer-disabled') errors.push('export control policy status drift');
if (
  policy.runtime_web_surface_enabled!==false
  || policy.raw_export_materializer_enabled!==false
  || policy.collection_enabled!==false
  || policy.export_enabled!==false
) {
  errors.push('export control policy must remain offline/control-only');
}
if (policy.database_role!=='pcs_calibration_export_control') errors.push('export control DB role drift');
if (policy.environments?.database_url!=='PCS_CALIBRATION_EXPORT_CONTROL_DATABASE_URL') errors.push('export control DB env drift');
if (policy.environments?.operator_token!=='PCS_CALIBRATION_OPERATOR_TOKEN') errors.push('export control token env drift');
if (JSON.stringify(policy.commands)!==JSON.stringify(['request','review','approve','reject'])) errors.push('export control command set drift');
if (policy.scope_argv_allowed!==false || policy.token_argv_allowed!==false) errors.push('scope/token argv must remain forbidden');
if (policy.direct_table_access_allowed!==false) errors.push('export control direct table access must remain false');
if (policy.request_requires_role!=='calibration-export-requester') errors.push('requester role drift');
if (JSON.stringify(policy.review_roles)!==JSON.stringify(['calibration-export-approver','calibration-reviewer'])) errors.push('review role set drift');
if (policy.decision_requires_role!=='calibration-export-approver') errors.push('decision role drift');
if (policy.requester_may_approve_own_request!==false) errors.push('self approval must remain prohibited');
if (policy.decision_audit_required!==true) errors.push('decision audit must remain required');
if (policy.production_provisioning_complete!==false) errors.push('production export-control provisioning must remain pending');

const expectedScopeSources={
  wave:'data/calibration/beta-wave-ja-01-draft.json',
  freeze:'data/calibration/beta-wave-ja-01-scope-freeze-v0.1-dev.json',
  consent:'data/calibration/consent-purpose-v0.1-dev.json',
  export_schema:'data/calibration/export-schema-v0.1-dev.json'
};
if (JSON.stringify(policy.scope_sources)!==JSON.stringify(expectedScopeSources)) errors.push('export control scope-source refs drift');

if (
  wave.version_scope_frozen!==true
  || freeze.status!=='repository-frozen-not-preregistered'
  || freeze.external_preregistered!==false
  || wave.sample_size_plan?.preregistered!==false
  || wave.preregistration_document_ref!==null
) {
  errors.push('export control must bind repository-frozen but externally-unregistered Wave JA-01');
}
if (
  wave.collection_enabled!==false
  || wave.export_enabled!==false
  || wave.collection_start_allowed!==false
  || consent.collection_authorized!==false
  || consent.export_authorized!==false
  || exportSchema.runtime_export_enabled!==false
) {
  errors.push('export control must not activate collection/materialization/export');
}

const expectedControlFunctions=[
  'public.pcs_authenticate_calibration_operator(text)',
  'public.pcs_request_calibration_export(text,text,text,text,text,text,text,text,text,text)',
  'public.pcs_review_calibration_export_request(text,uuid)',
  'public.pcs_decide_calibration_export_request(text,uuid,text)'
];
if (Object.keys(dbPolicy.roles?.pcs_calibration_auth?.table_privileges ?? {}).length!==0) {
  errors.push('auth role must have zero direct table privileges');
}
if (Object.keys(dbPolicy.roles?.pcs_calibration_export_control?.table_privileges ?? {}).length!==0) {
  errors.push('control role must have zero direct table privileges');
}
if (JSON.stringify(dbPolicy.roles?.pcs_calibration_export_control?.function_execute)!==JSON.stringify(expectedControlFunctions)) {
  errors.push('control function EXECUTE allowlist drift');
}
if (dbPolicy.roles?.pcs_calibration_export_control?.schema_create_allowed!==false) errors.push('control role schema CREATE must remain denied');

for (const fragment of [
  'SECURITY DEFINER',
  'SET search_path = pg_catalog',
  'public.pcs_authenticate_calibration_operator',
  'public.pcs_request_calibration_export',
  'public.pcs_review_calibration_export_request',
  'public.pcs_decide_calibration_export_request',
  "p_wave_id <> 'beta-ja-wave-01-draft'",
  "p_export_schema_version <> 'calibration-export-record-v0.1-dev'",
  "p_consent_version <> 'calibration-consent-ja-v0.1-dev'",
  "p_assessment_model_version <> 'assessment-dev-v0.3'",
  "p_item_bank_version <> 'item-bank-v0.2'",
  "p_scoring_version <> 'scoring-v0.1-dev'",
  "p_trait_dictionary_version <> 'trait-dictionary-v0.2'",
  "p_locale <> 'ja-JP'",
  "r.role = 'calibration-export-requester'",
  "r.role IN ('calibration-export-approver','calibration-reviewer')",
  "r.role = 'calibration-export-approver'",
  'calibration self approval forbidden',
  'FOR UPDATE',
  'INSERT INTO public.calibration_operator_audit_events',
  "REVOKE ALL ON FUNCTION public.pcs_decide_calibration_export_request(text,uuid,text) FROM PUBLIC"
]) {
  if (!migration.includes(fragment)) errors.push(`export control migration missing ${fragment}`);
}
if ((migration.match(/SECURITY DEFINER/g) ?? []).length!==4) errors.push('all four export-control DB functions must be SECURITY DEFINER');
if ((migration.match(/SET search_path = pg_catalog/g) ?? []).length!==4) errors.push('all four export-control DB functions must lock search_path');
if (/FROMs+calibration_/i.test(migration) || /INTOs+calibration_/i.test(migration) || /UPDATEs+calibration_/i.test(migration)) {
  errors.push('SECURITY DEFINER migration must schema-qualify calibration tables');
}

for (const fragment of [
  'REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM pcs_calibration_auth',
  'REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM pcs_calibration_export_control',
  'GRANT EXECUTE ON FUNCTION public.pcs_authenticate_calibration_operator(text)',
  'GRANT EXECUTE ON FUNCTION public.pcs_request_calibration_export(',
  'GRANT EXECUTE ON FUNCTION public.pcs_review_calibration_export_request(text,uuid)',
  'GRANT EXECUTE ON FUNCTION public.pcs_decide_calibration_export_request(text,uuid,text)',
  'TO pcs_calibration_export_control'
]) {
  if (!grants.includes(fragment)) errors.push(`grant template missing ${fragment}`);
}

for (const fragment of [
  'buildFrozenCalibrationExportScope',
  'parseCalibrationExportControlArgs',
  'PCS_CALIBRATION_EXPORT_CONTROL_DATABASE_URL',
  'PCS_CALIBRATION_OPERATOR_TOKEN',
  'public.pcs_request_calibration_export',
  'public.pcs_review_calibration_export_request',
  'public.pcs_decide_calibration_export_request'
]) {
  if (!cli.includes(fragment) && !lib.includes(fragment) && !JSON.stringify(policy).includes(fragment)) {
    errors.push(`export control implementation missing ${fragment}`);
  }
}
for (const forbiddenArg of [
  '--assessment-model-version','--item-bank-version','--scoring-version','--trait-dictionary-version','--wave-id','--locale'
]) {
  if (!lib.includes(`'${forbiddenArg}'`)) errors.push(`scope argv rejection missing ${forbiddenArg}`);
}
if (!operatorCli.includes('public.pcs_authenticate_calibration_operator')) errors.push('operator whoami must use execute-only auth function');
if (/SELECT\s+o\.operator_id[\s\S]*calibration_operators/i.test(operatorCli)) errors.push('operator whoami must not directly read operator tables');

if (governance.implementation_status?.export_control_workflow_implemented!==true) errors.push('governance export-control implementation flag missing');
if (governance.implementation_status?.raw_export_materializer_implemented!==false) errors.push('raw export materializer must remain false');
if (governance.collection_enabled!==false || governance.export_enabled!==false) errors.push('governance collection/export must remain false');
if (protocol.governance_policy_foundation?.export_control_workflow_implemented!==true) errors.push('protocol export-control implementation summary missing');

if (fs.existsSync(path.join('src','app','api','calibration'))) errors.push('runtime calibration API must remain absent');
if (pkg.scripts?.['operator:calibration-export-control']!=='node scripts/calibration-export-control.mjs') errors.push('export control npm command missing');
if (pkg.scripts?.['test:calibration-export-control:integration']!=='node tests/infrastructure/calibration-export-control.integration.mjs') errors.push('export control integration npm command missing');
if (!pkg.scripts?.['test:domain']?.includes('tests/infrastructure/calibration-export-control-cli.test.mjs')) errors.push('export control unit tests not wired');
if (!pkg.scripts?.['validate:calibration']?.includes('validate-calibration-export-control.mjs')) errors.push('export control validator not wired');
if (!ci.includes('Calibration export control integration') || !ci.includes('npm run test:calibration-export-control:integration')) errors.push('CI export-control integration step missing');
if (ci.includes('PCS_CALIBRATION_EXPORT_CONTROL_DATABASE_URL:') || ci.includes('PCS_CALIBRATION_OPERATOR_TOKEN:')) {
  errors.push('CI must not define persistent/global calibration operator control credentials');
}

if (errors.length) {
  console.error(`Calibration export control validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Calibration export control validation passed: execute-only DB APIs enforce frozen Wave JA-01 requester/reviewer/approver control and bounded audit while raw materialization, runtime collection/export and production provisioning remain disabled.');
