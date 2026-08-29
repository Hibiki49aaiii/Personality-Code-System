import fs from 'node:fs';

const plan=JSON.parse(fs.readFileSync('data/calibration/beta-wave-ja-01-draft.json','utf8'));
const protocol=JSON.parse(fs.readFileSync('data/calibration/beta-protocol-v0.1-dev.json','utf8'));
const consent=JSON.parse(fs.readFileSync('data/calibration/consent-purpose-v0.1-dev.json','utf8'));
const release=JSON.parse(fs.readFileSync('data/release/assessment-dev-v0.3.json','utf8'));
const errors=[];

if (plan.wave_plan_version !== 'beta-wave-plan-v0.1-dev') errors.push('unexpected beta wave plan version');
if (plan.wave_id !== 'beta-ja-wave-01-draft') errors.push('unexpected beta wave draft id');
if (plan.status !== 'registration-ready-not-preregistered') errors.push('beta wave must be registration-ready but not preregistered');
if (plan.registration_ready !== true) errors.push('beta wave registration_ready must be true');
if (plan.collection_enabled !== false || plan.export_enabled !== false || plan.collection_start_allowed !== false) {
  errors.push('beta wave collection/export/start must remain disabled');
}
if (plan.version_scope_frozen !== true) errors.push('registration-ready candidate repository scope must be frozen');
if (plan.scope_freeze_ref !== 'data/calibration/beta-wave-ja-01-scope-freeze-v0.1-dev.json') errors.push('beta wave scope-freeze reference drift');
if (!/^[a-f0-9]{64}$/.test(plan.scope_freeze_aggregate_sha256 ?? '')) errors.push('beta wave scope-freeze aggregate hash missing');

if (plan.locale !== release.locale) errors.push('wave locale/release locale drift');
if (plan.version_scope.assessment_model_version !== release.model_version) errors.push('wave assessment model drift');
if (plan.version_scope.item_bank_version !== release.versions.item_bank_version) errors.push('wave item bank drift');
if (plan.version_scope.scoring_version !== release.versions.scoring_version) errors.push('wave scoring version drift');
if (plan.version_scope.trait_dictionary_version !== release.versions.trait_dictionary_version) errors.push('wave Trait Dictionary version drift');

if (plan.purpose_id !== consent.purpose_id || plan.consent_version !== consent.consent_version) errors.push('wave consent/purpose identity drift');
if (consent.legal_approved !== false || consent.collection_authorized !== false || consent.export_authorized !== false) {
  errors.push('registration-ready wave must reference a non-authorizing consent contract');
}

if (JSON.stringify(plan.analysis_modules) !== JSON.stringify(protocol.planned_analysis_modules)) {
  errors.push('wave planned analyses must match the beta protocol bundle');
}

const expectedRecruitmentChannels=[
  'approved-online-community',
  'approved-social-media',
  'participant-referral'
];
const expectedInclusion=[
  'age-18-or-older',
  'affirmative-calibration-consent',
  'can-read-and-answer-ja-JP-instrument',
  'exact-wave-and-version-scope'
];
const expectedExclusion=[
  'withdrawn-calibration-consent',
  'incomplete-assessment',
  'mixed-or-wrong-version-scope',
  'corrupt-or-out-of-domain-response',
  'processing-duplicate-calibration-record'
];

if (typeof plan.recruitment_plan?.population_description !== 'string' || plan.recruitment_plan.population_description.length < 40) {
  errors.push('registration-ready population description missing');
}
if (JSON.stringify(plan.recruitment_plan?.recruitment_channels) !== JSON.stringify(expectedRecruitmentChannels)) {
  errors.push('recruitment channels drift');
}
if (JSON.stringify(plan.recruitment_plan?.inclusion_criteria) !== JSON.stringify(expectedInclusion)) {
  errors.push('inclusion criteria drift');
}
if (JSON.stringify(plan.recruitment_plan?.exclusion_criteria) !== JSON.stringify(expectedExclusion)) {
  errors.push('recruitment exclusion criteria drift');
}
if (plan.recruitment_plan?.representativeness_claim_allowed !== false) {
  errors.push('beta volunteer sample must not claim population representativeness');
}

const sample=plan.sample_size_plan;
if (sample?.preregistered !== false) errors.push('sample plan must remain not externally preregistered');
if (sample?.target_n !== 1000) errors.push('Wave 01 target_n must remain 1000 until amendment/new wave');
if (sample?.minimum_primary_analysis_n !== 800) errors.push('Wave 01 primary analysis minimum must remain 800 until amendment/new wave');
if (sample?.recruitment_window_days !== 56) errors.push('Wave 01 recruitment window must remain 56 days');
for (const key of ['stopping_rule','shortfall_rule','rationale','factor_analysis_complexity_note','expected_retest_attrition','subgroup_or_dif_scope']) {
  if (typeof sample?.[key] !== 'string' || sample[key].length < 30) errors.push(`registration-ready sample field missing/weak: ${key}`);
}
if (!sample.stopping_rule.includes('1000') || !sample.stopping_rule.includes('56')) errors.push('stopping rule must encode N=1000 / 56-day rule');
if (!sample.shortfall_rule.includes('800') || !/pilot|descriptive/i.test(sample.shortfall_rule)) errors.push('shortfall rule must downgrade N<800');
if (!Array.isArray(sample.uncertainty_or_precision_targets) || sample.uncertainty_or_precision_targets.length < 3) {
  errors.push('uncertainty/precision targets incomplete');
}

const retest=plan.retest_plan;
if (retest?.planned !== true || retest?.exact_model_version_required !== true) errors.push('retest intent/exact model requirement drift');
if (retest?.interval_days_min !== 14 || retest?.interval_days_max !== 21) errors.push('retest window must remain 14-21 days');
if (retest?.target_completed_n !== 200) errors.push('retest target must remain 200');
if (retest?.minimum_interpretable_n !== 150) errors.push('retest interpretation minimum must remain 150');
if (typeof retest?.attrition_rule !== 'string' || !retest.attrition_rule.includes('150')) errors.push('retest attrition/shortfall rule missing');
if (typeof retest?.context_change_recording_rule !== 'string' || !retest.context_change_recording_rule.includes('no free text')) {
  errors.push('retest context-change privacy rule missing');
}
if (retest?.linkage_status !== 'planned-not-implemented-requires-reviewed-schema-and-consent') {
  errors.push('retest linkage must remain planned/not implemented');
}

const exclusion=plan.exclusion_plan;
if (exclusion?.status !== 'registration-ready-not-preregistered') errors.push('exclusion plan status drift');
if (JSON.stringify(exclusion?.rules) !== JSON.stringify(expectedExclusion)) errors.push('primary exclusion rules drift');
if (exclusion?.response_style_primary_exclusion !== false) errors.push('response-style flags must not become primary exclusions');
const expectedSensitivity=[
  'all-midpoint-response-pattern',
  'dominant-response-pattern',
  'extreme-response-concentration'
];
if (JSON.stringify(exclusion?.sensitivity_flags) !== JSON.stringify(expectedSensitivity)) errors.push('response-style sensitivity flags drift');
if (typeof exclusion?.sensitivity_rule !== 'string' || !/sensitivity/i.test(exclusion.sensitivity_rule)) errors.push('sensitivity-analysis rule missing');

const holdout=plan.holdout_plan;
if (holdout?.confirmatory_holdout_planned !== true) errors.push('deterministic holdout must remain planned');
if (holdout?.development_fraction !== 0.70 || holdout?.holdout_fraction !== 0.30) errors.push('holdout split must remain 70/30');
if (holdout?.minimum_total_n_for_confirmatory_use !== 800) errors.push('holdout confirmatory use minimum must remain tied to N=800');
if (typeof holdout?.assignment_rule !== 'string'
  || !holdout.assignment_rule.includes('SHA-256')
  || !holdout.assignment_rule.includes('first 8 hex digits')
  || !holdout.assignment_rule.includes('0–69')
  || !holdout.assignment_rule.includes('70–99')) {
  errors.push('deterministic SHA-256 holdout assignment rule missing');
}
if (typeof holdout?.holdout_access_rule !== 'string' || !holdout.holdout_access_rule.includes('Do not inspect')) {
  errors.push('holdout access/freeze rule missing');
}
if (typeof holdout?.shortfall_rule !== 'string' || !holdout.shortfall_rule.includes('800')) errors.push('holdout shortfall rule missing');

const policy=plan.analysis_decision_policy;
if (policy?.single_statistic_can_promote_stage !== false) errors.push('single statistic must not promote model stage');
if (policy?.marketing_type_count_can_override_measurement_evidence !== false) errors.push('marketing type count must not override measurement evidence');
const triggers=policy?.review_triggers ?? {};
if (triggers.item_loading_below !== 0.30) errors.push('item loading review trigger drift');
if (triggers.cross_loading_at_or_above !== 0.30) errors.push('cross-loading review trigger drift');
if (triggers.omega_below !== 0.70) errors.push('omega low review trigger drift');
if (triggers.omega_above_redundancy_review !== 0.95) errors.push('omega redundancy review trigger drift');
if (triggers.absolute_inter_trait_correlation_at_or_above !== 0.80) errors.push('inter-Trait overlap review trigger drift');
if (triggers.retest_icc_below !== 0.70) errors.push('retest ICC review trigger drift');
if (typeof policy?.trigger_semantics !== 'string' || !policy.trigger_semantics.includes('not an automatic validation/pass/fail rule')) {
  errors.push('numeric triggers must be explicitly non-automatic');
}
if (JSON.stringify(policy?.fit_indices_to_report) !== JSON.stringify(['CFI','TLI','RMSEA','SRMR'])) {
  errors.push('held-out structural fit-index reporting set drift');
}
if (!Array.isArray(policy?.retest_statistics) || policy.retest_statistics.length < 3) errors.push('retest statistics bundle incomplete');

const dif=plan.demographic_dif_policy;
if (dif?.demographic_fields_collected !== false || dif?.dif_invariance_inferential_objective !== false) {
  errors.push('Wave 01 must not collect demographics or claim DIF/invariance inference');
}
if (typeof dif?.rule !== 'string' || !dif.rule.includes('separately justified consent/export schema')) {
  errors.push('future DIF/invariance governance rule missing');
}

if (plan.preregistration_document_ref !== null) errors.push('external preregistration reference must remain null until a real record exists');
const requiredBlockers=[
  'external-preregistration-record',
  'final-consent-copy-and-legal-approval',
  'production-environment-separation-evidence',
  'calibration-retention-deletion-policy',
  'operator-production-provisioning-evidence',
  'retest-linkage-schema-and-consent'
];
for (const blocker of requiredBlockers) {
  if (!plan.activation_blockers?.includes(blocker)) errors.push(`missing beta activation blocker ${blocker}`);
}
if (plan.activation_blockers?.includes('operator-authorization-audit')) {
  errors.push('repository-implemented operator auth/audit must not remain as the Wave operator blocker');
}
if (plan.activation_blockers?.includes('frozen-version-scope')) {
  errors.push('satisfied repository scope-freeze blocker must be removed');
}

const forbiddenDataKeys=new Set([
  'email',
  'name',
  'real_name',
  'ip_address',
  'precise_location',
  'free_text',
  'session_id',
  'token',
  'public_share_token'
]);
function walkKeys(value,path=[]) {
  if (Array.isArray(value)) {
    value.forEach((v,i)=>walkKeys(v,[...path,String(i)]));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key,child] of Object.entries(value)) {
    if (forbiddenDataKeys.has(key.toLowerCase())) errors.push(`forbidden participant/data field in wave plan: ${[...path,key].join('.')}`);
    walkKeys(child,[...path,key]);
  }
}
walkKeys(plan);

if (!fs.existsSync('docs/model/BETA_WAVE_JA_01_PREREGISTRATION_DRAFT.md')) {
  errors.push('human-readable preregistration candidate document missing');
}

if (errors.length) {
  console.error(`Beta wave registration-ready validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Beta wave registration-ready validation passed: concrete N/recruitment/exclusion/holdout/retest/analysis rules are frozen as a candidate, while external preregistration, collection and export remain disabled.');
