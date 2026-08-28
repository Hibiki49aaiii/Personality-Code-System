import fs from 'node:fs';

const registry=JSON.parse(fs.readFileSync('data/release/production-evidence-registry-v0.1-dev.json','utf8'));
const launch=JSON.parse(fs.readFileSync('data/release/public-launch-gate-v0.1-dev.json','utf8'));
const activation=JSON.parse(fs.readFileSync('data/release/production-model-activation-gate-v0.1-dev.json','utf8'));
const requirements=fs.readFileSync('REQUIREMENTS.md','utf8');
const errors=[];

if (registry.evidence_registry_version!=='production-evidence-registry-v0.1-dev') errors.push('unexpected production evidence registry version');
if (registry.candidate_model_version!==activation.candidate_model_version) errors.push('evidence registry/candidate model mismatch');
if (registry.entry_count!==registry.entries.length || registry.entries.length<16) errors.push('evidence registry entry count incomplete');
if (registry.public_launch_ready!==launch.public_launch_ready) errors.push('evidence registry/public launch readiness mismatch');

const launchKeys=new Set(Object.keys(launch.external_manual_evidence));
const activationKeys=new Set(Object.keys(activation.production_evidence));
const boundLaunch=new Map();
const boundActivation=new Map();
const ids=new Set();
const placeholders=new Set(registry.completion_contract.placeholder_values_prohibited.map((v)=>v.toLowerCase()));

function bind(map,key,entryId,kind) {
  if (map.has(key)) errors.push(`${kind} key ${key} bound more than once: ${map.get(key)}, ${entryId}`);
  map.set(key,entryId);
}

for (const entry of registry.entries) {
  if (!/^[a-z0-9][a-z0-9-]+$/.test(entry.evidence_id??'')) errors.push(`invalid evidence_id ${entry.evidence_id}`);
  if (ids.has(entry.evidence_id)) errors.push(`duplicate evidence_id ${entry.evidence_id}`);
  ids.add(entry.evidence_id);
  if (!['external','manual','release','research'].includes(entry.evidence_type)) errors.push(`${entry.evidence_id}: invalid evidence_type`);
  if (!['pending','complete'].includes(entry.status)) errors.push(`${entry.evidence_id}: invalid status ${entry.status}`);

  for (const key of entry.gate_bindings?.public_launch_keys??[]) bind(boundLaunch,key,entry.evidence_id,'launch');
  for (const key of entry.gate_bindings?.production_activation_keys??[]) bind(boundActivation,key,entry.evidence_id,'activation');

  if (entry.status==='pending') {
    if (entry.evidence!==null) errors.push(`${entry.evidence_id}: pending evidence must remain null`);
  } else {
    const evidence=entry.evidence;
    if (!evidence || typeof evidence!=='object') { errors.push(`${entry.evidence_id}: complete status requires evidence object`); continue; }
    for (const field of registry.completion_contract.required_fields) {
      const value=evidence[field];
      if (typeof value!=='string' || !value.trim()) errors.push(`${entry.evidence_id}: complete evidence missing ${field}`);
      if (typeof value==='string' && placeholders.has(value.trim().toLowerCase())) errors.push(`${entry.evidence_id}: placeholder value prohibited for ${field}`);
    }
    if (evidence.observed_at && Number.isNaN(Date.parse(evidence.observed_at))) errors.push(`${entry.evidence_id}: observed_at must be ISO-8601 parseable`);
    if (evidence.environment && !registry.completion_contract.allowed_environments.includes(evidence.environment)) errors.push(`${entry.evidence_id}: invalid environment`);
    if (evidence.artifact_ref && /^(?:todo|tbd|pending|example):?/i.test(evidence.artifact_ref)) errors.push(`${entry.evidence_id}: artifact_ref is not inspectable`);
  }
}

const sorted=(iter)=>[...iter].sort();
if (JSON.stringify(sorted(launchKeys))!==JSON.stringify(sorted(boundLaunch.keys()))) {
  errors.push(`public-launch evidence bindings drift: gate=${sorted(launchKeys).join(',')} registry=${sorted(boundLaunch.keys()).join(',')}`);
}
if (JSON.stringify(sorted(activationKeys))!==JSON.stringify(sorted(boundActivation.keys()))) {
  errors.push(`production-activation evidence bindings drift: gate=${sorted(activationKeys).join(',')} registry=${sorted(boundActivation.keys()).join(',')}`);
}

for (const [key,status] of Object.entries(launch.external_manual_evidence)) {
  const entry=registry.entries.find((e)=>e.evidence_id===boundLaunch.get(key));
  if (!entry || entry.status!==status) errors.push(`public-launch evidence status mismatch ${key}: gate=${status}, registry=${entry?.status}`);
}
for (const [key,status] of Object.entries(activation.production_evidence)) {
  const entry=registry.entries.find((e)=>e.evidence_id===boundActivation.get(key));
  if (!entry || entry.status!==status) errors.push(`production-activation evidence status mismatch ${key}: gate=${status}, registry=${entry?.status}`);
}

const pending=registry.entries.filter((e)=>e.status!=='complete').map((e)=>e.evidence_id);
if (launch.public_launch_ready===false && pending.length===0) errors.push('all canonical evidence is complete but launch remains blocked; explicit gate review required');
if (launch.public_launch_ready===false && !requirements.includes('**PCS-OPS-006**')) errors.push('OPS-006 requirement missing');

if (errors.length) {
  console.error(`Production evidence registry validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(JSON.stringify({
  evidence_registry_version:registry.evidence_registry_version,
  canonical_evidence_count:registry.entries.length,
  pending_evidence:pending,
  public_launch_ready:launch.public_launch_ready
},null,2));
