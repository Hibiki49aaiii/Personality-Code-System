import fs from 'node:fs';

const contract=JSON.parse(fs.readFileSync('data/operations/observability-v0.1-dev.json','utf8'));
const health=fs.readFileSync('src/app/api/health/route.ts','utf8');
const events=JSON.parse(fs.readFileSync('data/analytics/event-dictionary-v0.1-dev.json','utf8'));
const runbook=fs.readFileSync('docs/operations/OBSERVABILITY_RUNBOOK_v0.1.md','utf8');
const master=fs.readFileSync('REQUIREMENTS.md','utf8');
const errors=[];

if (contract.observability_contract_version !== 'observability-v0.1-dev') errors.push('unexpected observability contract version');
if (contract.production_operational !== false) errors.push('production observability must remain unclaimed until external evidence exists');

for (const [key,value] of Object.entries({
  raw_answers_in_logs_allowed:false,
  trait_vector_in_logs_allowed:false,
  bearer_tokens_in_logs_allowed:false,
  free_form_client_error_in_analytics_allowed:false,
  third_party_diagnostic_payload_export_default:false
})) if (contract.privacy?.[key] !== value) errors.push(`privacy boundary drift: ${key}`);

if (contract.readiness.route !== 'GET /api/health' || contract.readiness.healthy_status !== 200 || contract.readiness.degraded_status !== 503) errors.push('readiness contract drift');
for (const fragment of ["status: 'ok'","status: 'degraded'","select 1 as ready","'Cache-Control': 'no-store, max-age=0'"]) {
  if (!health.includes(fragment)) errors.push(`health route missing ${fragment}`);
}
for (const forbidden of contract.readiness.forbidden_response_fields) {
  const responseObjectPattern=new RegExp(`\\b${forbidden}\\s*:`,'i');
  if (responseObjectPattern.test(health)) errors.push(`health response may expose forbidden field ${forbidden}`);
}

const eventNames=new Set(events.events.map((event)=>event.name));
for (const name of contract.first_party_signals) if (!eventNames.has(name)) errors.push(`missing declared first-party signal ${name}`);

const requiredMonitors=['readiness-availability','application-error-rate','assessment-finalization-health','database-health-latency','deployment-correlation','cwv-field-monitoring'];
for (const id of requiredMonitors) {
  const row=contract.production_monitors.find((item)=>item.id===id);
  if (!row) errors.push(`missing production monitor class ${id}`);
  else if (row.status !== 'pending-external') errors.push(`${id}: external monitor must remain pending before deployment evidence`);
}

for (const fragment of ['P0','P1','ROLLBACK_RUNBOOK_v0.1.md','production_operational=false']) {
  if (!runbook.includes(fragment)) errors.push(`observability runbook missing ${fragment}`);
}
const opsLine=master.split('\n').find((line)=>line.includes('**PCS-OPS-003**')) ?? '';
if (/^- \[x\]/.test(opsLine)) errors.push('PCS-OPS-003 cannot close while production_operational=false');
if (contract.operational_evidence_required.length < 5) errors.push('external operational evidence list is incomplete');

if (errors.length) {
  console.error(`Observability contract validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Observability contract validation passed: privacy-safe readiness/signals/runbook exist while all independently durable production monitor classes remain explicitly external/pending.');
