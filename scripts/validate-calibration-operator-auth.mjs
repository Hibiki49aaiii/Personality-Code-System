import fs from 'node:fs';
import path from 'node:path';

const authPolicy=JSON.parse(
  fs.readFileSync('data/calibration/operator-auth-policy-v0.1-dev.json','utf8')
);
const dbPolicy=JSON.parse(
  fs.readFileSync('data/security/calibration-operator-db-role-policy-v0.1-dev.json','utf8')
);
const governance=JSON.parse(
  fs.readFileSync('data/calibration/governance-policy-v0.1-dev.json','utf8')
);
const cli=fs.readFileSync('scripts/calibration-operator.mjs','utf8');
const lib=fs.readFileSync('scripts/lib/calibration-operator-cli.mjs','utf8');
const grants=fs.readFileSync('ops/sql/calibration-operator-role-grants.sql','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const ci=fs.readFileSync('.github/workflows/ci.yml','utf8');
const errors=[];

if (authPolicy.operator_auth_policy_version!=='calibration-operator-auth-policy-v0.1-dev') {
  errors.push('unexpected operator auth policy version');
}
if (authPolicy.status!=='engineering-implemented-runtime-disabled') {
  errors.push('operator auth policy status drift');
}
if (
  authPolicy.runtime_web_surface_enabled!==false ||
  authPolicy.raw_export_materializer_enabled!==false ||
  authPolicy.collection_enabled!==false ||
  authPolicy.export_enabled!==false
) {
  errors.push('operator auth policy must not enable web/runtime calibration collection/export');
}

const token=authPolicy.token ?? {};
if (
  token.entropy_bytes!==32 ||
  token.encoding!=='base64url' ||
  token.canonical_length!==43 ||
  token.hash_algorithm!=='sha256'
) {
  errors.push('operator credential format drift');
}
for (const key of [
  'raw_token_database_storage_allowed',
  'raw_token_argv_allowed',
  'raw_token_stdout_allowed',
  'credential_hash_stdout_allowed'
]) {
  if (token[key]!==false) errors.push(`operator credential leakage policy must remain false: ${key}`);
}

const expectedCommands=['issue','whoami','grant-role','revoke-role','revoke-credential'];
if (JSON.stringify(authPolicy.commands)!==JSON.stringify(expectedCommands)) {
  errors.push('operator CLI command set drift');
}
const expectedRoles=[
  'calibration-export-requester',
  'calibration-export-approver',
  'calibration-privacy-operator',
  'calibration-reviewer'
];
if (JSON.stringify(authPolicy.roles)!==JSON.stringify(expectedRoles)) {
  errors.push('operator CLI role allowlist drift');
}
if (JSON.stringify(governance.authorization?.roles)!==JSON.stringify(expectedRoles)) {
  errors.push('operator auth roles must match calibration governance roles');
}

const env=authPolicy.environments ?? {};
const expectedEnv={
  admin_database_url:'PCS_CALIBRATION_OPERATOR_ADMIN_DATABASE_URL',
  auth_database_url:'PCS_CALIBRATION_AUTH_DATABASE_URL',
  auth_token:'PCS_CALIBRATION_OPERATOR_TOKEN',
  admin_ack:'PCS_CALIBRATION_OPERATOR_ADMIN_ACK',
  admin_ack_value:'calibration-operator-admin-v0.1-dev'
};
for (const [key,value] of Object.entries(expectedEnv)) {
  if (env[key]!==value) errors.push(`operator auth env drift: ${key}`);
}

const output=authPolicy.credential_output ?? {};
if (
  output.explicit_path_required!==true ||
  output.exclusive_create!==true ||
  output.file_mode_octal!=='0600' ||
  output.overwrite_allowed!==false ||
  output.trailing_newline!==true
) {
  errors.push('credential output contract drift');
}

if (authPolicy.database_roles?.auth_role!=='pcs_calibration_auth') errors.push('auth DB role drift');
if (authPolicy.database_roles?.admin_role!=='pcs_calibration_admin') errors.push('admin DB role drift');
if (authPolicy.production_provisioning_complete!==false) {
  errors.push('production operator provisioning must remain pending');
}
if (governance.implementation_status?.operator_authentication_implemented!==true) {
  errors.push('calibration governance must record implemented offline operator authentication tooling');
}
if (governance.implementation_status?.production_operator_provisioning_complete!==false) {
  errors.push('calibration governance must keep production operator provisioning pending');
}
if (!governance.activation_blockers?.includes('operator-production-provisioning-evidence')) {
  errors.push('calibration governance production operator provisioning blocker missing');
}

if (dbPolicy.calibration_operator_db_role_policy_version!=='calibration-operator-db-role-policy-v0.1-dev') {
  errors.push('unexpected calibration operator DB role policy version');
}
if (dbPolicy.status!=='repository-contract-tested-production-evidence-pending') {
  errors.push('calibration operator DB role status drift');
}
if (dbPolicy.production_role_evidence_complete!==false) {
  errors.push('production calibration DB role evidence must remain pending');
}

const expectedAuthPrivileges={
  calibration_operators:['SELECT'],
  calibration_operator_roles:['SELECT']
};
const expectedAdminPrivileges={
  calibration_operators:['SELECT','INSERT','UPDATE'],
  calibration_operator_roles:['SELECT','INSERT','DELETE']
};
if (JSON.stringify(dbPolicy.roles?.pcs_calibration_auth?.table_privileges)!==JSON.stringify(expectedAuthPrivileges)) {
  errors.push('auth DB privilege matrix drift');
}
if (JSON.stringify(dbPolicy.roles?.pcs_calibration_admin?.table_privileges)!==JSON.stringify(expectedAdminPrivileges)) {
  errors.push('admin DB privilege matrix drift');
}
if (dbPolicy.roles?.pcs_calibration_auth?.schema_create_allowed!==false) errors.push('auth role schema CREATE must remain denied');
if (dbPolicy.roles?.pcs_calibration_admin?.schema_create_allowed!==false) errors.push('admin role schema CREATE must remain denied');

for (const fragment of [
  'REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM pcs_calibration_auth',
  'REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM pcs_calibration_admin',
  'GRANT SELECT ON TABLE',
  'calibration_operators',
  'calibration_operator_roles',
  'TO pcs_calibration_auth',
  'GRANT SELECT, INSERT, UPDATE ON TABLE',
  'TO pcs_calibration_admin',
  'GRANT SELECT, INSERT, DELETE ON TABLE'
]) {
  if (!grants.includes(fragment)) errors.push(`calibration operator grant template missing ${fragment}`);
}
for (const forbidden of [
  'anonymous_sessions',
  'assessment_answers',
  'calibration_consent_receipts',
  'calibration_export_requests',
  'calibration_operator_audit_events',
  'calibration_record_links',
  'calibration_deletion_events'
]) {
  const grantLines=grants
    .split(/\n/)
    .filter((line)=>line.trim().startsWith(forbidden));
  if (grantLines.length>0) errors.push(`operator grant template unexpectedly names forbidden table ${forbidden}`);
}

for (const fragment of [
  "openSync(path, 'wx', 0o600)",
  'fchmodSync(fd, 0o600)',
  "randomBytes(CALIBRATION_OPERATOR_TOKEN_BYTES).toString('base64url')",
  "createHash('sha256')"
]) {
  if (!lib.includes(fragment)) errors.push(`operator CLI primitive missing ${fragment}`);
}
for (const fragment of [
  'policy.environments.auth_token',
  'policy.environments.admin_ack',
  'policy.environments.admin_database_url',
  'policy.environments.auth_database_url',
  "command:'whoami'",
  "command:'issue'"
]) {
  if (!cli.includes(fragment)) errors.push(`operator CLI implementation missing ${fragment}`);
}

if (/process\.argv[^\n]*token/i.test(cli)) errors.push('operator CLI appears to read token from argv');
if (/console\.log\s*\(/.test(cli)) errors.push('operator CLI must use bounded JSON writer instead of console.log');
if (fs.existsSync(path.join('src','app','api','calibration'))) {
  errors.push('runtime calibration API must remain absent');
}
if (!fs.existsSync('docs/operations/CALIBRATION_OPERATOR_CLI_v0.1.md')) {
  errors.push('calibration operator CLI runbook missing');
}
if (pkg.scripts?.['operator:calibration']!=='node scripts/calibration-operator.mjs') {
  errors.push('calibration operator npm command missing');
}
if (pkg.scripts?.['test:calibration-operator-auth:integration']!=='node tests/infrastructure/calibration-operator-auth.integration.mjs') {
  errors.push('calibration operator auth integration npm command missing');
}
if (!pkg.scripts?.['test:domain']?.includes('tests/infrastructure/calibration-operator-cli.test.mjs')) {
  errors.push('calibration operator CLI unit test is not wired into domain/infrastructure tests');
}
if (!ci.includes('Calibration operator authentication integration')
  || !ci.includes('npm run test:calibration-operator-auth:integration')) {
  errors.push('CI calibration operator auth integration step missing');
}
if (ci.includes('PCS_CALIBRATION_OPERATOR_TOKEN:')) {
  errors.push('CI workflow must not define a persistent/global calibration operator raw token');
}

if (errors.length) {
  console.error(`Calibration operator auth validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Calibration operator auth validation passed: offline credential lifecycle, secret handling and least-privilege auth/admin DB role contracts are fixed while raw export/runtime activation remain disabled.');
