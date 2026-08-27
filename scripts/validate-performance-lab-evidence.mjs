import fs from 'node:fs';

const evidence=JSON.parse(fs.readFileSync('data/performance/lab-evidence-v0.1-dev.json','utf8'));
const profile=JSON.parse(fs.readFileSync('data/performance/lab-profile-v0.1-dev.json','utf8'));
const budgets=JSON.parse(fs.readFileSync('data/performance/budgets-v0.1-dev.json','utf8'));
const workflow=fs.readFileSync('.github/workflows/performance-lab.yml','utf8');
const spec=fs.readFileSync('tests/performance/performance-lab.spec.ts','utf8');
const errors=[];

if (evidence.evidence_version !== 'performance-lab-evidence-v0.1-dev') errors.push('unexpected evidence version');
if (evidence.source_workflow.conclusion !== 'success') errors.push('frozen lab evidence must come from a successful workflow run');
if (evidence.field_data !== false || evidence.master_requirement_closure !== false) errors.push('lab evidence must not claim field data or requirement closure');
if (profile.acceptance_policy?.report_only !== true || profile.acceptance_policy?.master_requirement_closure !== false) errors.push('lab profile must remain report-only');
if (!workflow.includes('matrix:\n        profile: [desktop_ci, mobile_slow4g_ci]')) errors.push('workflow must run both representative profiles');
if (!spec.includes("'landing' | 'assessment' | 'private-result' | 'public-share'")) errors.push('lab test must cover all required surfaces');

const lcpGood=budgets.field_core_web_vitals.good_thresholds.LCP_ms;
const clsGood=budgets.field_core_web_vitals.good_thresholds.CLS;
const inpGood=budgets.field_core_web_vitals.good_thresholds.INP_ms;
for (const [profileName,row] of Object.entries(evidence.profiles)) {
  if (!profile.profiles[profileName]) errors.push(`evidence references unknown profile ${profileName}`);
  const surfaces=new Set();
  for (const metric of row.metrics ?? []) {
    surfaces.add(metric.surface);
    if (!Number.isFinite(metric.LCP_ms) || metric.LCP_ms < 0) errors.push(`${profileName}/${metric.surface}: invalid LCP`);
    if (!Number.isFinite(metric.CLS) || metric.CLS < 0) errors.push(`${profileName}/${metric.surface}: invalid CLS`);
    if (!Number.isFinite(metric.max_interaction_event_ms) || metric.max_interaction_event_ms < 0) errors.push(`${profileName}/${metric.surface}: invalid interaction proxy`);
    if (metric.LCP_ms > lcpGood) errors.push(`${profileName}/${metric.surface}: frozen lab LCP exceeds current good threshold`);
    if (metric.CLS > clsGood) errors.push(`${profileName}/${metric.surface}: frozen lab CLS exceeds current good threshold`);
    if (metric.max_interaction_event_ms > inpGood) errors.push(`${profileName}/${metric.surface}: interaction proxy exceeds current good INP threshold`);
  }
  for (const required of ['landing','assessment','private-result','public-share']) if (!surfaces.has(required)) errors.push(`${profileName}: missing ${required}`);
}

if (errors.length) {
  console.error(`Performance lab evidence validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Performance lab evidence validation passed: successful two-profile four-surface lab baseline is frozen without claiming field CWV or PCS-PERF-001 closure.');
