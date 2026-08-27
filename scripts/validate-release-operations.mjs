import fs from 'node:fs';

const policy = JSON.parse(fs.readFileSync('data/release/release-policy-v0.1-dev.json', 'utf8'));
const release = JSON.parse(fs.readFileSync('data/release/assessment-dev-v0.3.json', 'utf8'));
const codeSchema = JSON.parse(fs.readFileSync('data/code-schema/v0.1-dev.json', 'utf8'));
const content = JSON.parse(fs.readFileSync('data/content/dev-v0.3.json', 'utf8'));
const rollback = fs.readFileSync('docs/operations/ROLLBACK_RUNBOOK_v0.1.md', 'utf8');
const errors = [];

if (policy.release_policy_version !== 'release-operations-v0.1-dev') errors.push('unexpected release policy version');
if (JSON.stringify(policy.environments) !== JSON.stringify(['development','preview','production'])) errors.push('release policy must define development/preview/production environments');
if (policy.production_requires_distinct_environment !== true) errors.push('production must require a distinct environment');
if (policy.production_secrets_outside_git !== true) errors.push('production secrets must remain outside git');
if (policy.production_ai_runtime_credentials_allowed !== false) errors.push('production AI runtime credentials must remain prohibited');
if (policy.normal_promotion_requires_ci_green !== true) errors.push('normal promotion must require green CI');
if (policy.published_version_rewrite_allowed !== false || policy.model_release.published_is_immutable !== true) errors.push('published release rewriting must be prohibited');
if (policy.database_rollback_default !== 'forward-fix') errors.push('database rollback default must be forward-fix');

const expectedRollback = ['application-code','database-migrations','assessment-model','content','illustration-assets','share-card-template'];
for (const domain of expectedRollback) if (!policy.rollback_domains.includes(domain)) errors.push(`missing rollback domain ${domain}`);

if (release.model_version !== 'assessment-dev-v0.3' || release.status !== 'beta') errors.push('current development release identity/status drift');
if (release.production_activation_allowed !== false || release.public_release_allowed !== false) errors.push('development model must not be production/public activatable');
if (release.item_count !== 147) errors.push('development release item_count must remain 147');
if (release.versions.code_schema_version !== codeSchema.code_schema_version) errors.push('release/code schema version mismatch');
if (release.versions.content_version !== content.content_version) errors.push('release/content version mismatch');
if (codeSchema.public_use !== false) errors.push('this development release validator expects C01D public_use=false');
if (!release.current_blockers.includes('code-schema-public-use-false')) errors.push('release must explicitly record C01D public-use blocker');
if (!release.current_blockers.includes('phase-5-beta-evidence-not-collected')) errors.push('release must explicitly record missing Phase 5 evidence');

const expectedVersions = {
  trait_dictionary_version: 'trait-dictionary-v0.2',
  item_bank_version: 'item-bank-v0.2',
  scoring_version: 'scoring-v0.1-dev',
  code_schema_version: 'core-code-v0.1-dev',
  interaction_version: 'trait-interactions-v0.1',
  content_version: 'content-dev-v0.3'
};
for (const [key,value] of Object.entries(expectedVersions)) {
  if (release.versions[key] !== value) errors.push(`release version tuple drift: ${key}`);
}

for (const key of ['deterministic_tests_required','golden_snapshot_required','migration_review_required','content_compatibility_required','rollback_plan_required','public_code_schema_required_for_production','evidence_stage_required_for_production']) {
  if (release.release_checks[key] !== true) errors.push(`release check must remain required: ${key}`);
}
if (release.rollback.published_version_rewrite_allowed !== false) errors.push('model rollback must not rewrite published versions');
if (release.rollback.database_strategy !== 'forward-fix') errors.push('release manifest database strategy must be forward-fix');

for (const heading of [
  '## 1. Application code rollback',
  '## 2. Database migration rollback / forward-fix',
  '## 3. Assessment model rollback',
  '## 4. Content rollback',
  '## 5. Illustration/asset rollback',
  '## 6. Share-card template rollback',
  '## Verification after any rollback',
  '## Data impact / affected-result handling'
]) {
  if (!rollback.includes(heading)) errors.push(`rollback runbook missing required section: ${heading}`);
}

if (errors.length) {
  console.error(`Release operations validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Release operations validation passed: environment/secret/AI boundaries, immutable beta release tuple, production blockers, rollback domains and forward-fix procedure are explicit and machine checked.');
