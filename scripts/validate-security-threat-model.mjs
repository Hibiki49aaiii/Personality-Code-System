import fs from 'node:fs';

const model=JSON.parse(fs.readFileSync('data/security/threat-model-v0.1-dev.json','utf8'));
const evidence=JSON.parse(fs.readFileSync('data/release/production-evidence-registry-v0.1-dev.json','utf8'));
const requirements=fs.readFileSync('REQUIREMENTS.md','utf8');
const errors=[];

if (model.threat_model_version!=='security-threat-model-v0.1-dev') errors.push('unexpected threat model version');
if (model.status!=='repository-threat-review-external-review-pending') errors.push('threat model status drift');
if (model.external_security_review_complete!==false) errors.push('external security review must remain unclaimed');
if (model.threat_count!==model.threats.length || model.threats.length<16) errors.push('threat model coverage incomplete');

const evidenceIds=new Set(evidence.entries.map((entry)=>entry.evidence_id));
const ids=new Set();
for (const threat of model.threats) {
  if (!/^TM-\d{3}$/.test(threat.id??'')) errors.push(`invalid threat id ${threat.id}`);
  if (ids.has(threat.id)) errors.push(`duplicate threat id ${threat.id}`);
  ids.add(threat.id);
  if (!model.allowed_statuses.includes(threat.status)) errors.push(`${threat.id}: invalid status ${threat.status}`);
  for (const key of ['category','title','asset','trust_boundary','attack','impact','residual']) {
    if (typeof threat[key]!=='string'||threat[key].trim().length<5) errors.push(`${threat.id}: missing/short ${key}`);
  }
  if (!Array.isArray(threat.mitigations)||threat.mitigations.length===0) errors.push(`${threat.id}: mitigations missing`);
  if (!Array.isArray(threat.evidence)||threat.evidence.length===0) errors.push(`${threat.id}: repository evidence missing`);
  for (const id of threat.external_evidence_ids??[]) {
    if (!evidenceIds.has(id)) errors.push(`${threat.id}: unknown canonical external evidence ${id}`);
  }
  if (threat.status==='partial-external' && (threat.external_evidence_ids??[]).length===0) errors.push(`${threat.id}: partial-external threat needs canonical external evidence binding`);
  if (threat.status==='deferred-fail-closed' && !/blocked|absent|false|fail/i.test(threat.mitigations.join(' '))) errors.push(`${threat.id}: deferred threat must describe fail-closed mitigation`);
}

for (const category of ['capability-confidentiality','csrf','privacy-export','public-export','database-privilege','backup-privacy','logging','dependency-supply-chain','secret-exposure','runtime-ai-boundary','crawler-privacy','calibration-consent']) {
  if (!model.threats.some((threat)=>threat.category===category)) errors.push(`missing required threat category ${category}`);
}

const qaLine=requirements.split('\n').find((line)=>line.includes('**PCS-QA-007**'))??'';
if (!qaLine.startsWith('- [ ]')) errors.push('PCS-QA-007 must remain open while external security review is pending');

if (errors.length) {
  console.error(`Security threat-model validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(JSON.stringify({
  threat_model_version:model.threat_model_version,
  threat_count:model.threats.length,
  repository_mitigated:model.threats.filter((t)=>t.status==='mitigated-repository').length,
  partial_external:model.threats.filter((t)=>t.status==='partial-external').map((t)=>t.id),
  deferred_fail_closed:model.threats.filter((t)=>t.status==='deferred-fail-closed').map((t)=>t.id),
  external_security_review_complete:false
},null,2));
