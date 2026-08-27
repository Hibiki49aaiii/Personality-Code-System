import fs from 'node:fs';

const policy=JSON.parse(fs.readFileSync('data/privacy/diagnostic-retention-v0.1-dev.json','utf8'));
const inventory=JSON.parse(fs.readFileSync('data/privacy/data-inventory-v0.1-dev.json','utf8'));
const legal=fs.readFileSync('docs/legal/PUBLIC_LEGAL_DISCLOSURE_DRAFT_v0.1.md','utf8');
const baseline=fs.readFileSync('docs/model/PERSISTENCE_RETENTION_BASELINE_v0.1.md','utf8');
const migration=fs.readFileSync('drizzle/0007_diagnostic_retention_answer_guard.sql','utf8');
const cleanup=fs.readFileSync('scripts/cleanup-diagnostic-retention.mjs','utf8');
const ci=fs.readFileSync('.github/workflows/ci.yml','utf8');
const errors=[];

if (policy.diagnostic_retention_policy_version !== 'diagnostic-retention-v0.1-dev') errors.push('unexpected diagnostic retention policy version');
if (policy.status !== 'development-engineering-baseline') errors.push('diagnostic retention policy must remain a development engineering baseline');
if (policy.abandoned_session_days !== 30) errors.push('abandoned session baseline drift');
if (policy.completed_raw_answers_days !== 90) errors.push('completed raw-answer baseline drift');
if (policy.completed_private_result_days !== 180) errors.push('private result baseline drift');
if (policy.completed_session_metadata_days !== 180 || policy.completed_trait_scores_days !== 180) errors.push('completed session/Trait Score retention must align with private-result baseline in v0.1-dev');
if (policy.public_share_on_private_result_retention !== 'revoke-and-detach') errors.push('private-result retention/public-share behavior drift');
if (policy.user_controlled_deletion_available_before_schedule !== true) errors.push('scheduled retention must not remove the interactive deletion right');
if (policy.dry_run_default !== true || policy.execute_requires_explicit_ack !== true) errors.push('diagnostic cleanup must remain dry-run first and require explicit execute acknowledgement');

const byId=new Map(inventory.classes.map((row)=>[row.id,row]));
if (byId.get('anonymous-session-operational')?.retention !== 'abandoned-30-days-engineering-baseline') errors.push('inventory/session retention drift');
if (byId.get('anonymous-diagnostic-answers')?.retention !== 'completed-90-days-engineering-baseline') errors.push('inventory/raw-answer retention drift');
if (byId.get('derived-private-diagnostic-result')?.retention !== 'private-result-180-days-engineering-baseline') errors.push('inventory/private-result retention drift');

for (const fragment of ['30日基準','90日基準','180日基準']) if (!legal.includes(fragment)) errors.push(`legal factual draft missing ${fragment}`);
for (const fragment of ['30 days','90 days','180 days']) if (!baseline.includes(fragment)) errors.push(`persistence baseline missing ${fragment}`);

if (!/session_completed_at\s*<=\s*now\(\)\s*-\s*interval\s*'90 days'/i.test(migration)) errors.push('database guard must permit completed raw-answer deletion only after 90 days');
if (!migration.includes("session_status = 'completed'")) errors.push('retention answer-delete guard must be limited to completed sessions');

for (const fragment of [
  "const execute = process.argv.includes('--execute')",
  'PCS_DIAGNOSTIC_RETENTION_EXECUTION_ACK',
  "status = 'in_progress'",
  "status = 'completed'",
  'DELETE FROM assessment_answers',
  'DELETE FROM anonymous_sessions',
  'active_public_shares_to_revoke'
]) if (!cleanup.includes(fragment)) errors.push(`cleanup implementation missing ${fragment}`);

if (!ci.includes('Diagnostic retention integration')) errors.push('CI must execute real diagnostic retention integration');
if (!ci.includes('Diagnostic retention cleanup dry-run')) errors.push('CI must exercise diagnostic retention dry-run');
if (!ci.includes('Validate diagnostic retention policy and cleanup contract')) errors.push('CI must validate diagnostic retention policy contract');

if (errors.length) {
  console.error(`Diagnostic retention validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Diagnostic retention validation passed: 30/90/180-day engineering windows, DB deletion guard, dry-run/ack execution, public-share revocation semantics and CI integration remain aligned.');
