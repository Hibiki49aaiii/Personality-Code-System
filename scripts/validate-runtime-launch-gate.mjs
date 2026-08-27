import fs from 'node:fs';

const launch=JSON.parse(fs.readFileSync('data/release/public-launch-gate-v0.1-dev.json','utf8'));
const release=JSON.parse(fs.readFileSync('data/release/assessment-dev-v0.3.json','utf8'));
const environment=JSON.parse(fs.readFileSync('data/operations/environment-contract-v0.1-dev.json','utf8'));
const domain=fs.readFileSync('src/domain/release/deploymentGate.ts','utf8');
const server=fs.readFileSync('src/server/deploymentGate.ts','utf8');
const service=fs.readFileSync('src/application/assessment/serverAssessmentService.ts','utf8');
const robots=fs.readFileSync('src/app/robots.ts','utf8');
const layout=fs.readFileSync('src/app/layout.tsx','utf8');
const e2e=fs.readFileSync('tests/e2e/launch-gate.spec.ts','utf8');
const errors=[];

if (launch.public_launch_ready !== false || launch.launch_actions.enable_public_indexing_allowed !== false) errors.push('current runtime launch gate validator expects launch/indexing blocked');
if (release.production_activation_allowed !== false || release.public_release_allowed !== false) errors.push('current candidate must remain production/public blocked');
if (!environment.server_environment_variables.PCS_DEPLOYMENT_ENV) errors.push('environment contract must require PCS_DEPLOYMENT_ENV');

for (const fragment of [
  "configured !== 'development'",
  "configured !== 'preview'",
  "configured !== 'production'",
  "nodeEnv === 'production'",
  'candidateProductionActivationAllowed',
  'publicLaunchReady',
  'publicIndexingAllowed'
]) if (!domain.includes(fragment)) errors.push(`deployment domain gate missing ${fragment}`);

for (const fragment of ['assessment-dev-v0.3.json','public-launch-gate-v0.1-dev.json','assertNewAssessmentStartAllowed','isPublicIndexingAllowed']) {
  if (!server.includes(fragment)) errors.push(`server launch gate missing ${fragment}`);
}
if (!service.includes('assertNewAssessmentStartAllowed(modelVersion)')) errors.push('new assessment creation is not guarded');
if (!robots.includes("disallow: '/'")) errors.push('robots route must disallow crawling while launch gate is false');
if (!layout.includes('{ index: false, follow: false, nocache: true }')) errors.push('global metadata must remain noindex/nofollow before launch');
if (!e2e.includes('Disallow: /') || !e2e.includes('noindex')) errors.push('browser launch-gate evidence missing');

if (errors.length) {
  console.error(`Runtime launch-gate validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Runtime launch-gate validation passed: production assessment starts and crawler indexing remain fail-closed while explicit preview environments can exercise the beta application.');
