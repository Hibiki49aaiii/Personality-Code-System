import fs from 'node:fs';

const plan=JSON.parse(fs.readFileSync('data/calibration/beta-wave-ja-01-draft.json','utf8'));
const protocol=JSON.parse(fs.readFileSync('data/calibration/beta-protocol-v0.1-dev.json','utf8'));
const consent=JSON.parse(fs.readFileSync('data/calibration/consent-purpose-v0.1-dev.json','utf8'));
const release=JSON.parse(fs.readFileSync('data/release/assessment-dev-v0.3.json','utf8'));
const errors=[];

if (plan.wave_plan_version !== 'beta-wave-plan-v0.1-dev') errors.push('unexpected beta wave plan version');
if (plan.wave_id !== 'beta-ja-wave-01-draft') errors.push('unexpected beta wave draft id');
if (plan.status !== 'draft-not-preregistered') errors.push('beta wave must remain draft until actual preregistration');
if (plan.collection_enabled !== false || plan.export_enabled !== false || plan.collection_start_allowed !== false) {
  errors.push('beta wave collection/export/start must remain disabled');
}
if (plan.version_scope_frozen !== false) errors.push('draft wave scope must not claim frozen/preregistered status');

if (plan.locale !== release.locale) errors.push('wave locale/release locale drift');
if (plan.version_scope.assessment_model_version !== release.model_version) errors.push('wave assessment model drift');
if (plan.version_scope.item_bank_version !== release.versions.item_bank_version) errors.push('wave item bank drift');
if (plan.version_scope.scoring_version !== release.versions.scoring_version) errors.push('wave scoring version drift');
if (plan.version_scope.trait_dictionary_version !== release.versions.trait_dictionary_version) errors.push('wave Trait Dictionary version drift');

if (plan.purpose_id !== consent.purpose_id || plan.consent_version !== consent.consent_version) errors.push('wave consent/purpose identity drift');
if (consent.legal_approved !== false || consent.collection_authorized !== false) errors.push('draft wave must reference a non-authorizing consent contract');

if (JSON.stringify(plan.analysis_modules) !== JSON.stringify(protocol.planned_analysis_modules)) {
  errors.push('wave planned analyses must match the frozen beta protocol bundle');
}

if (plan.sample_size_plan.preregistered !== false) errors.push('sample plan must remain unregistered');
for (const key of ['target_n','rationale','factor_analysis_complexity_note','expected_retest_attrition','subgroup_or_dif_scope']) {
  if (plan.sample_size_plan[key] !== null) errors.push(`draft sample-size field must remain null before preregistration: ${key}`);
}
if (!Array.isArray(plan.sample_size_plan.uncertainty_or_precision_targets) || plan.sample_size_plan.uncertainty_or_precision_targets.length !== 0) {
  errors.push('draft precision targets must remain empty before preregistration');
}

if (plan.recruitment_plan.population_description !== null) errors.push('recruitment population must not be invented before preregistration');
for (const key of ['recruitment_channels','inclusion_criteria','exclusion_criteria']) {
  if (!Array.isArray(plan.recruitment_plan[key]) || plan.recruitment_plan[key].length !== 0) errors.push(`draft recruitment field must remain empty: ${key}`);
}

if (plan.retest_plan.planned !== true || plan.retest_plan.exact_model_version_required !== true) errors.push('retest intent/exact model requirement drift');
for (const key of ['interval_days_min','interval_days_max','attrition_rule','context_change_recording_rule']) {
  if (plan.retest_plan[key] !== null) errors.push(`draft retest field must remain null before preregistration: ${key}`);
}

if (plan.exclusion_plan.status !== 'must-be-preregistered' || plan.exclusion_plan.rules.length !== 0) errors.push('exclusion rules must remain unregistered');
if (plan.holdout_plan.confirmatory_holdout_planned !== null || plan.holdout_plan.assignment_rule !== null) errors.push('holdout plan must remain unset');
if (plan.preregistration_document_ref !== null) errors.push('preregistration document reference must remain null until a real plan is registered');
if (!Array.isArray(plan.activation_blockers) || plan.activation_blockers.length < 9) errors.push('beta wave activation blocker list incomplete');

const forbiddenKeys=['participant','email','name','answer','responses','session_id','token','ip_address','demographic'];
const serialized=JSON.stringify(plan).toLowerCase();
for (const key of forbiddenKeys) {
  if (key === 'answer' && serialized.includes('answer-level')) continue;
  if (serialized.includes(`"${key}"`)) errors.push(`draft wave plan must not contain participant/data field ${key}`);
}

if (errors.length) {
  console.error(`Beta wave draft validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Beta wave draft validation passed: exact v0.3 candidate scope is reviewable, but recruitment/N/retest/exclusion/holdout/preregistration remain intentionally unset and collection/export stay disabled.');
