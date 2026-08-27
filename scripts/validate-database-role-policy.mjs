import fs from 'node:fs';
import { readdirSync } from 'node:fs';
import path from 'node:path';

const policy=JSON.parse(fs.readFileSync('data/security/database-role-policy-v0.1-dev.json','utf8'));
const template=fs.readFileSync('ops/sql/runtime-role-grants.sql','utf8');
const inventory=JSON.parse(fs.readFileSync('data/privacy/data-inventory-v0.1-dev.json','utf8'));
const errors=[];

if (policy.database_role_policy_version !== 'database-role-policy-v0.1-dev') errors.push('unexpected DB role policy version');
if (policy.status !== 'repository-contract-tested-production-evidence-pending') errors.push('DB role policy status drift');
if (policy.migration_admin_separation_required !== true) errors.push('migration/admin separation must remain required');
if (policy.runtime_schema_create_allowed !== false) errors.push('runtime schema CREATE must remain forbidden');
if (policy.production_role_evidence_complete !== false) errors.push('production DB role evidence must remain pending');

const migrationDir='drizzle';
const migrations=readdirSync(migrationDir).filter((file)=>/^\d+_.*\.sql$/i.test(file)).sort();
const migrationText=migrations.map((file)=>fs.readFileSync(path.join(migrationDir,file),'utf8')).join('\n');
const created=[...migrationText.matchAll(/CREATE TABLE\s+([a-z0-9_]+)/gi)].map((match)=>match[1]).sort();
const policyTables=Object.keys(policy.runtime_table_privileges).sort();
if (JSON.stringify(created) !== JSON.stringify(policyTables)) {
  errors.push(`runtime privilege table coverage drift: migrations=${created.join(',')} policy=${policyTables.join(',')}`);
}

const inventoryTables=inventory.classes.flatMap((row)=>row.tables).sort();
if (JSON.stringify(policyTables) !== JSON.stringify(inventoryTables)) {
  errors.push('runtime privilege policy must cover exactly the privacy-inventoried tables');
}

const allowedPrivileges=new Set(['SELECT','INSERT','UPDATE','DELETE']);
for (const [table,privileges] of Object.entries(policy.runtime_table_privileges)) {
  if (!/^[a-z][a-z0-9_]+$/.test(table)) errors.push(`unsafe table name ${table}`);
  if (!Array.isArray(privileges) || privileges.length===0) errors.push(`${table}: empty privilege list`);
  for (const privilege of privileges) if (!allowedPrivileges.has(privilege)) errors.push(`${table}: prohibited runtime privilege ${privilege}`);
}

for (const table of [
  'trait_definitions','trait_definition_revisions','assessment_items','assessment_item_revisions',
  'assessment_model_releases','assessment_model_items','content_versions','content_modules','illustration_assets'
]) {
  if (JSON.stringify(policy.runtime_table_privileges[table]) !== JSON.stringify(['SELECT'])) {
    errors.push(`${table}: versioned/product definition table must remain read-only`);
  }
}

for (const fragment of [
  'GRANT USAGE ON SCHEMA public TO pcs_runtime',
  'REVOKE CREATE ON SCHEMA public FROM pcs_runtime',
  'GRANT SELECT ON TABLE',
  'assessment_model_releases',
  'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE',
  'anonymous_sessions',
  'public_share_snapshots',
  'rate_limit_buckets'
]) if (!template.includes(fragment)) errors.push(`runtime role SQL template missing ${fragment}`);

if (/GRANT\s+(?:CREATE|TRUNCATE|TRIGGER|REFERENCES).*pcs_runtime/i.test(template)) errors.push('runtime role SQL template grants prohibited capability');
if (policy.external_evidence_required.length < 5) errors.push('production DB role evidence list incomplete');

if (errors.length) {
  console.error(`Database runtime-role policy validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Database runtime-role policy validation passed: ${policyTables.length} tables have explicit least-privilege DML/read grants; production role evidence remains pending.`);
