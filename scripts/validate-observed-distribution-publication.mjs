import fs from 'node:fs';

const policy=JSON.parse(fs.readFileSync('data/analytics/observed-distribution-publication-policy-v0.1-dev.json','utf8'));
const codeSchema=JSON.parse(fs.readFileSync('data/code-schema/v0.1-dev.json','utf8'));
const errors=[];

if (policy.policy_version !== 'observed-distribution-publication-policy-v0.1-dev') errors.push('unexpected publication policy version');
if (policy.population_claim_allowed !== false) errors.push('population claims must remain prohibited');
if (policy.required_model_status !== 'published') errors.push('public observed distribution must require a published model');
if (policy.require_public_code_schema !== true) errors.push('public observed distribution must require a public code schema');
if (!Number.isInteger(policy.minimum_scope_sample_size) || policy.minimum_scope_sample_size < 100) errors.push('minimum scope sample must be an explicit conservative positive integer');
if (!Number.isInteger(policy.minimum_code_count) || policy.minimum_code_count < 5) errors.push('minimum code count must protect rare cells');
if (policy.display_percentage_decimals !== 1) errors.push('current display precision must remain one decimal unless policy version changes');
if (policy.insufficient_sample_label_ja !== '集計データ不足') errors.push('insufficient sample label drift');
if (codeSchema.public_use !== false) errors.push('C01D development schema publication boundary unexpectedly changed; review policy and public-model gate');
for (const text of ['人口の','人類の','日本人の','希少タイプ']) if (!policy.prohibited_copy_patterns.includes(text)) errors.push(`missing prohibited copy pattern ${text}`);

if (errors.length) {
 console.error(`Observed distribution publication policy validation failed with ${errors.length} error(s):`);
 for (const error of errors) console.error(`- ${error}`);
 process.exit(1);
}
console.log('Observed distribution publication policy validation passed: published/public-schema requirement, scope/cell thresholds, one-decimal display and population-claim prohibitions are fixed; C01D remains non-public.');
