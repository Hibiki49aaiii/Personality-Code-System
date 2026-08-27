import fs from 'node:fs';
import { readdirSync } from 'node:fs';
import path from 'node:path';

const policy=JSON.parse(fs.readFileSync('data/operations/backup-restore-policy-v0.1-dev.json','utf8'));
const integration=fs.readFileSync('tests/infrastructure/backup-restore-rehearsal.integration.mjs','utf8');
const ci=fs.readFileSync('.github/workflows/ci.yml','utf8');
const inventory=JSON.parse(fs.readFileSync('data/privacy/data-inventory-v0.1-dev.json','utf8'));
const errors=[];

if (policy.backup_restore_policy_version !== 'backup-restore-policy-v0.1-dev') errors.push('unexpected backup/restore policy version');
if (policy.status !== 'repository-logical-restore-tested-production-provider-pending') errors.push('backup policy status drift');
if (policy.engineering_backup_retention_days !== 35) errors.push('engineering backup retention baseline drift');
if (policy.production_backup_encryption_required !== true) errors.push('production backups must require encryption');
if (policy.production_backup_access_least_privilege_required !== true) errors.push('production backup access must require least privilege');
if (policy.restore_quarantine_required !== true || policy.public_traffic_during_restore_allowed !== false) errors.push('restore must remain quarantined from public traffic');
if (policy.production_restore_evidence_complete !== false) errors.push('production restore evidence must remain pending');
if (policy.logical_ci_rehearsal?.backup_artifact_uploaded !== false) errors.push('CI diagnostic backup artifact must not be uploaded');

const privacy=policy.privacy_restore_boundary;
if (privacy.older_backup_may_contain_later_deleted_data !== true) errors.push('restore policy must acknowledge deletion resurrection risk');
if (privacy.deletion_journal_replay_required_before_public_traffic !== true) errors.push('deletion replay must be required');
if (privacy.independently_durable_deletion_journal_implemented !== false) errors.push('independent deletion journal is not implemented yet');
if (privacy.public_share_resurrection_must_be_prevented !== true) errors.push('public-share resurrection prevention must remain explicit');
if (privacy.production_restore_privacy_safe !== false) errors.push('production restore privacy safety must remain unclaimed');

const migrationText=readdirSync('drizzle')
  .filter((file)=>/^\d+_.*\.sql$/i.test(file))
  .sort()
  .map((file)=>fs.readFileSync(path.join('drizzle',file),'utf8'))
  .join('\n');
const created=[...migrationText.matchAll(/CREATE TABLE\s+([a-z0-9_]+)/gi)].map((m)=>m[1]).sort();
const inventoryTables=inventory.classes.flatMap((row)=>row.tables).sort();
if (JSON.stringify(created)!==JSON.stringify(inventoryTables)) errors.push('backup policy table scope must stay aligned with privacy inventory');

for (const fragment of [
  "run('pg_dump'",
  "run('pg_restore'",
  'SELECT count(*)::int AS row_count',
  "WHERE NOT tgisinternal",
  'published assessment_model_releases are immutable',
  "rm(dumpPath"
]) if (!integration.includes(fragment)) errors.push(`backup integration missing ${fragment}`);

if (!ci.includes('Logical backup/restore rehearsal')) errors.push('CI must execute logical backup/restore rehearsal');
if (policy.external_evidence_required.length < 7) errors.push('production restore evidence list incomplete');

if (errors.length) {
  console.error(`Backup/restore policy validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Backup/restore policy validation passed: CI logical restore is scoped and private, while provider/deletion-replay production evidence remains fail-closed.');
