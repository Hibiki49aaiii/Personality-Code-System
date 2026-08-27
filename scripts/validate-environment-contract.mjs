import fs from 'node:fs';

const contract = JSON.parse(fs.readFileSync('data/operations/environment-contract-v0.1-dev.json','utf8'));
const cookie = fs.readFileSync('src/server/assessmentCookie.ts','utf8');
const rateLimit = fs.readFileSync('src/server/rateLimit.ts','utf8');
const origin = fs.readFileSync('src/server/siteOrigin.ts','utf8');
const errors=[];

if (contract.environment_contract_version !== 'environment-contract-v0.1-dev') errors.push('unexpected environment contract version');
if (contract.status !== 'repository-contract-only') errors.push('environment contract must remain repository-contract-only until deployment evidence exists');
if (contract.repository_proves_deployed_environment_separation !== false) errors.push('repository must not claim deployed environment separation');

for (const name of ['development','preview','production']) {
  if (!contract.environments[name]) errors.push(`missing environment class ${name}`);
}
for (const name of ['preview','production']) {
  if (contract.environments[name]?.tls_required !== true) errors.push(`${name} must require TLS`);
  if (contract.environments[name]?.distinct_database_required !== true) errors.push(`${name} must require a distinct database identity`);
}
if (contract.environments.production?.public_traffic_allowed !== true) errors.push('production must be the only normal public-traffic environment');
if (contract.environments.preview?.production_secrets_allowed !== false) errors.push('preview must prohibit production secrets');

for (const name of ['DATABASE_URL','PCS_RATE_LIMIT_SECRET','PCS_SITE_ORIGIN','PCS_ASSESSMENT_MODEL_VERSION']) {
  const def=contract.server_environment_variables[name];
  if (!def) errors.push(`missing server env definition ${name}`);
  else {
    if (def.required_preview !== true || def.required_production !== true) errors.push(`${name} must be explicit in preview and production`);
    if (def.client_exposure_allowed !== false) errors.push(`${name} must remain server-only`);
  }
}
if (contract.server_environment_variables.PCS_RATE_LIMIT_SECRET?.minimum_characters !== 32) errors.push('production rate-limit secret minimum must remain 32 chars');
if (contract.server_environment_variables.PCS_SITE_ORIGIN?.production_https_required !== true) errors.push('production PCS_SITE_ORIGIN must require HTTPS');

for (const key of ['OPENAI_API_KEY','ANTHROPIC_API_KEY','GOOGLE_GENERATIVE_AI_API_KEY','COHERE_API_KEY']) {
  if (!contract.production_forbidden_runtime_credentials.includes(key)) errors.push(`missing prohibited production AI credential ${key}`);
}

for (const key of ['external_evidence_required_before_ops_001_completion','external_evidence_required_before_ops_002_completion','external_evidence_required_before_qa_007_completion']) {
  if (!Array.isArray(contract[key]) || contract[key].length < 3) errors.push(`${key} must remain an explicit external evidence list`);
}

if (!cookie.includes("secure: process.env.NODE_ENV === 'production'")) errors.push('production Secure-cookie safeguard missing');
if (!rateLimit.includes("process.env.PCS_RATE_LIMIT_SECRET")) errors.push('runtime rate-limit secret lookup missing');
if (!rateLimit.includes("process.env.NODE_ENV !== 'production'")) errors.push('rate-limit development fallback boundary missing');
if (!origin.includes("process.env.PCS_SITE_ORIGIN")) errors.push('explicit site-origin configuration path missing');

if (errors.length) {
  console.error(`Environment contract validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Environment contract validation passed: dev/preview/prod boundaries, server-only configuration, TLS/database separation requirements, production AI-key prohibition and external-evidence boundaries are explicit.');
