import fs from 'node:fs';

const contract = JSON.parse(fs.readFileSync('data/privacy/user-deletion-v0.1-dev.json','utf8'));
const route = fs.readFileSync('src/app/api/assessment/data/route.ts','utf8');
const repository = fs.readFileSync('src/infrastructure/persistence/anonymousDataDeletionRepository.ts','utf8');
const migration = fs.readFileSync('drizzle/0006_privacy_delete_cascade_guards.sql','utf8');
const policy = JSON.parse(fs.readFileSync('data/security/rate-limits-v0.1-dev.json','utf8'));
const ui = fs.readFileSync('src/app/result/DataControls.tsx','utf8');
const e2e = fs.readFileSync('tests/e2e/assessment-flow.spec.ts','utf8');
const csrf = fs.readFileSync('tests/e2e/csrf-origin.spec.ts','utf8');
const integration = fs.readFileSync('tests/infrastructure/anonymous-data-deletion-repository.integration.test.ts','utf8');
const errors=[];

if (contract.deletion_contract_version !== 'anonymous-diagnostic-deletion-v0.1-dev') errors.push('unexpected deletion contract version');
if (contract.status !== 'development-implemented') errors.push('deletion contract must describe implemented development behavior');
if (contract.endpoint !== 'DELETE /api/assessment/data') errors.push('endpoint drift');
if (contract.ownership !== 'private-session-bearer-cookie') errors.push('ownership contract drift');
if (contract.public_policy_ready !== false) errors.push('public policy readiness must remain false before launch review');

for (const fragment of [
  'assertTrustedMutationRequest(request)',
  "applyRateLimit(db, request, 'data-deletion', privateToken)",
  'deleteAnonymousAssessmentDataByToken',
  'clearAssessmentSessionCookie(response)'
]) {
  if (!route.includes(fragment)) errors.push(`deletion route missing ${fragment}`);
}

for (const fragment of [
  'hashAnonymousSessionToken(token)',
  '.delete(publicShareSnapshots)',
  '.delete(anonymousSessions)'
]) {
  if (!repository.includes(fragment)) errors.push(`deletion repository missing ${fragment}`);
}

const cascadeGuardCount=(migration.match(/TG_OP\s*=\s*'DELETE'\s+AND\s+session_status\s+IS\s+NULL/gi)||[]).length;
if (cascadeGuardCount < 2) errors.push('answer/trait-score privacy cascade guards missing');

const deletionPolicy=policy.scopes?.['data-deletion'];
if (!deletionPolicy || deletionPolicy.principal !== 'session' || deletionPolicy.max_requests > 10) {
  errors.push('data-deletion rate-limit must exist, be session-bound, and remain conservative');
}

for (const fragment of ['診断データを削除','削除を確定','この操作は取り消せません']) {
  if (!ui.includes(fragment)) errors.push(`data deletion UI missing ${fragment}`);
}

if (!e2e.includes("getByRole('button', { name: '削除を確定' })")) errors.push('browser deletion confirmation test missing');
if (!e2e.includes("toHaveURL('http://localhost:3000/')")) errors.push('browser deletion cookie/session invalidation assertion missing');
if (!csrf.includes("request.delete('/api/assessment/data'")) errors.push('cross-site deletion rejection test missing');
for (const fragment of ['deletedPublicShareCount','assessmentAnswers','assessmentTraitScores','resultSnapshots','productEvents']) {
  if (!integration.includes(fragment)) errors.push(`deletion integration evidence missing ${fragment}`);
}

if (!Array.isArray(contract.remaining_public_policy_blockers) || contract.remaining_public_policy_blockers.length < 4) {
  errors.push('launch blockers must remain explicit');
}

if (errors.length) {
  console.error(`Anonymous diagnostic deletion validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Anonymous diagnostic deletion validation passed: bearer-owned destructive path, CSRF/rate-limit/cookie clearing, cascade semantics, public-share cleanup and launch blockers are explicit.');
