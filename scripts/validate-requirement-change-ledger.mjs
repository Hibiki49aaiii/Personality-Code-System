import fs from 'node:fs';

const master=fs.readFileSync('REQUIREMENTS.md','utf8');
const ledger=JSON.parse(fs.readFileSync('data/governance/requirement-change-ledger-v0.1-dev.json','utf8'));
const errors=[];

const version=master.match(/^> Version:\s*([^\s]+)$/m)?.[1];
const lastUpdated=master.match(/^> Last updated:\s*(\d{4}-\d{2}-\d{2})$/m)?.[1];
if (!version) errors.push('REQUIREMENTS version missing');
if (!lastUpdated) errors.push('REQUIREMENTS last-updated date missing');
if (ledger.change_ledger_version !== 'requirement-change-ledger-v0.1-dev') errors.push('unexpected change-ledger version');
if (ledger.status !== 'active-governance-process') errors.push('change-ledger status drift');
if (ledger.current_master_requirements_version !== version) errors.push(`ledger/master requirement version mismatch: ${ledger.current_master_requirements_version} != ${version}`);
if (!Array.isArray(ledger.entries) || ledger.entries.length < 5) errors.push('material change ledger is incomplete');

const ids=new Set([...master.matchAll(/\*\*(PCS-[A-Z]+-\d{3})\*\*/g)].map((match)=>match[1]));
const changeIds=new Set();
let latestDate='';
for (const entry of ledger.entries ?? []) {
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z0-9-]+$/.test(entry.change_id ?? '')) errors.push(`invalid change_id ${entry.change_id}`);
  if (changeIds.has(entry.change_id)) errors.push(`duplicate change_id ${entry.change_id}`);
  changeIds.add(entry.change_id);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date ?? '')) errors.push(`${entry.change_id}: invalid date`);
  if (entry.date > latestDate) latestDate=entry.date;
  if (entry.requirements_version_after !== version) errors.push(`${entry.change_id}: requirements version must resolve to current master version in v0.1 ledger`);
  if (!Array.isArray(entry.affected_requirement_ids) || entry.affected_requirement_ids.length===0) errors.push(`${entry.change_id}: no affected requirement IDs`);
  for (const id of entry.affected_requirement_ids ?? []) if (!ids.has(id)) errors.push(`${entry.change_id}: unknown requirement ID ${id}`);
  for (const key of ['change','rationale','assessment_model_impact','code_schema_impact','content_impact','data_migration_impact','compatibility_impact']) {
    if (typeof entry[key] !== 'string' || !entry[key].trim()) errors.push(`${entry.change_id}: missing ${key}`);
  }
  if (!Array.isArray(entry.impacted_files) || entry.impacted_files.length===0) errors.push(`${entry.change_id}: impacted_files missing`);
  if (!Array.isArray(entry.evidence) || entry.evidence.length===0) errors.push(`${entry.change_id}: evidence missing`);
}
if (latestDate !== lastUpdated) errors.push(`latest ledger date ${latestDate} must equal REQUIREMENTS Last updated ${lastUpdated}`);

if (errors.length) {
  console.error(`Requirement change-ledger validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Requirement change-ledger validation passed: ${ledger.entries.length} material changes explicitly record rationale, requirement IDs and assessment/code/content/data/compatibility impact for REQUIREMENTS v${version}.`);
