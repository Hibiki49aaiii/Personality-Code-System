import fs from 'node:fs';

const gate=JSON.parse(fs.readFileSync('data/release/production-model-activation-gate-v0.1-dev.json','utf8'));
const release=JSON.parse(fs.readFileSync('data/release/assessment-dev-v0.3.json','utf8'));
const code=JSON.parse(fs.readFileSync('data/code-schema/v0.1-dev.json','utf8'));
const publication=JSON.parse(fs.readFileSync('data/type-catalog/v0.1-dev/publication-gate.json','utf8'));
const a11y=JSON.parse(fs.readFileSync('data/accessibility/manual-release-review-v0.1-dev.json','utf8'));
const observability=JSON.parse(fs.readFileSync('data/operations/observability-v0.1-dev.json','utf8'));
const launch=JSON.parse(fs.readFileSync('data/release/public-launch-gate-v0.1-dev.json','utf8'));
const requirements=fs.readFileSync('REQUIREMENTS.md','utf8');
const errors=[];

if (gate.activation_gate_version !== 'production-model-activation-gate-v0.1-dev') errors.push('unexpected activation gate version');
if (gate.status !== 'blocked' || gate.production_activation_allowed !== false || gate.public_release_allowed !== false) errors.push('development candidate activation must remain blocked');
if (gate.candidate_model_version !== release.model_version) errors.push('candidate/release manifest model mismatch');
if (gate.candidate_release_manifest_version !== release.release_manifest_version) errors.push('release manifest version mismatch');
if (release.production_activation_allowed !== false || release.public_release_allowed !== false) errors.push('candidate manifest must remain non-production');
if (code.public_use !== false) errors.push('current activation gate expects non-public C01D');
if (publication.public_catalog_ready !== false) errors.push('public catalog must remain blocked');
if (a11y.closure_allowed !== false) errors.push('manual accessibility closure unexpectedly allowed');
if (observability.production_operational !== false) errors.push('production observability unexpectedly operational');
if (launch.public_launch_ready !== false) errors.push('public launch unexpectedly ready');

for (const [key,status] of Object.entries(gate.repository_evidence)) {
  if (status !== 'complete') errors.push(`repository activation evidence must be complete or removed: ${key}`);
}
for (const [key,status] of Object.entries(gate.production_evidence)) {
  if (status !== 'pending') errors.push(`production activation evidence must remain pending until inspectable proof exists: ${key}`);
}
for (const [key,value] of Object.entries(gate.activation_actions)) {
  if (value !== false) errors.push(`activation action must remain blocked: ${key}`);
}
for (const key of ['published_version_rewrite_allowed','activation_must_reference_exact_version_tuple','migration_review_required','rollback_plan_required','green_ci_required']) {
  const expected=key==='published_version_rewrite_allowed' ? false : true;
  if (gate.freeze_semantics[key] !== expected) errors.push(`freeze semantic drift: ${key}`);
}

const opsLine=requirements.split('\n').find((line)=>line.includes('**PCS-OPS-005**')) ?? '';
const scoreLine=requirements.split('\n').find((line)=>line.includes('**PCS-SCORE-003**')) ?? '';
if (/^- \[x\]/.test(opsLine) || /^- \[x\]/.test(scoreLine)) errors.push('OPS-005/SCORE-003 cannot close while production activation evidence is pending');

if (errors.length) {
  console.error(`Production model activation validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(JSON.stringify({
  activation_gate_version:gate.activation_gate_version,
  candidate_model_version:gate.candidate_model_version,
  production_activation_allowed:false,
  pending_production_evidence:Object.keys(gate.production_evidence)
},null,2));
