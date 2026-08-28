import fs from 'node:fs';

const contract=JSON.parse(fs.readFileSync('data/release/release-evidence-contract-v0.1-dev.json','utf8'));
const workflow=fs.readFileSync('.github/workflows/ci.yml','utf8');
const generator=fs.readFileSync('scripts/generate-release-evidence-pack.mjs','utf8');
const errors=[];

if (contract.release_evidence_contract_version!=='release-evidence-pack-v0.1-dev') errors.push('unexpected release evidence contract version');
if (contract.status!=='ci-evidence-pack-contract') errors.push('release evidence contract status drift');
if (contract.secret_values_allowed!==false) errors.push('release evidence pack must prohibit secret values');
if (contract.source_commit_required!==true) errors.push('release evidence pack must require source commit');
if (contract.workflow_position!=='after-all-required-ci-checks') errors.push('release evidence pack workflow position drift');
if (contract.artifact_retention_days!==30) errors.push('release evidence artifact retention drift');

for (const file of contract.required_identity_files) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) errors.push(`required release identity file missing: ${file}`);
}

for (const fragment of [
  "crypto.createHash('sha256')",
  "process.env.GITHUB_SHA",
  "execFileSync('git',['rev-parse','HEAD']",
  "production_deployment_proven:false",
  "scientific_validation_proven:false",
  "public_taxonomy_approved:false",
  "fs.writeFileSync(output,serialized,{mode:0o600})"
]) if (!generator.includes(fragment)) errors.push(`release evidence generator missing ${fragment}`);

for (const forbidden of ['DATABASE_URL','PCS_RATE_LIMIT_SECRET','process.env.OPENAI_API_KEY','process.env.ANTHROPIC_API_KEY']) {
  if (generator.includes(forbidden)) errors.push(`release evidence generator must not read secret/runtime credential ${forbidden}`);
}

const e2e=workflow.indexOf('- name: Browser E2E — 147 items to private result');
const freeze=workflow.indexOf('- name: Freeze release candidate evidence pack');
const upload=workflow.indexOf('- name: Upload release candidate evidence pack');
if (e2e<0 || freeze<0 || upload<0) errors.push('CI release evidence steps missing');
else if (!(e2e < freeze && freeze < upload)) errors.push('release evidence pack must be generated/uploaded only after Browser E2E');

if (!workflow.includes('retention-days: 30')) errors.push('CI release evidence artifact retention must be 30 days');
if (!workflow.includes('npm run evidence:release-candidate')) errors.push('CI release evidence generator command missing');

if (errors.length) {
  console.error(`Release evidence pack validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Release evidence pack contract validation passed: ${contract.required_identity_files.length} identity files + ordered migrations are hashed after full CI/E2E, with no runtime secrets or production/validation claims.`);
