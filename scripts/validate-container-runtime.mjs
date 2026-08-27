import fs from 'node:fs';

const contract=JSON.parse(fs.readFileSync('data/operations/container-runtime-v0.1-dev.json','utf8'));
const next=fs.readFileSync('next.config.ts','utf8');
const docker=fs.readFileSync('Dockerfile','utf8');
const ignore=fs.readFileSync('.dockerignore','utf8');
const health=fs.readFileSync('src/app/api/health/route.ts','utf8');
const smoke=fs.readFileSync('scripts/smoke-standalone-runtime.mjs','utf8');
const errors=[];

if (contract.runtime_package_version !== 'container-runtime-v0.1-dev') errors.push('unexpected runtime package version');
if (contract.production_deployment_proven !== false) errors.push('repository packaging must not claim production deployment');
if (contract.next_output !== 'standalone' || !next.includes('output: "standalone"')) errors.push('Next standalone output is not enabled');
if (contract.process_user.root_allowed !== false || contract.image_rules.non_root_required !== true) errors.push('runtime contract must require non-root execution');

for (const fragment of [
  'FROM node:22-alpine AS runner',
  'adduser --system --uid 1001 nextjs',
  'USER nextjs',
  'COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./',
  'COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static',
  'CMD ["node", "server.js"]'
]) if (!docker.includes(fragment)) errors.push(`Dockerfile missing ${fragment}`);

for (const secret of contract.forbidden_runtime_credentials) {
  if (new RegExp(`ENV[^\\n]*${secret}`,'i').test(docker)) errors.push(`Dockerfile must not bake forbidden credential ${secret}`);
}
for (const required of ['node_modules','.next','.git','.env']) if (!ignore.includes(required)) errors.push(`.dockerignore missing ${required}`);
if (!health.includes("status: 'ok'") || !health.includes("status: 'degraded'")) errors.push('health route contract missing');
if (!smoke.includes("runtime:'next-standalone'") || !smoke.includes('/api/health')) errors.push('standalone runtime smoke test missing');
if (!contract.required_server_environment.includes('PCS_DEPLOYMENT_ENV')) errors.push('runtime contract must require explicit PCS_DEPLOYMENT_ENV');
if (!contract.required_server_environment.includes('PCS_CLIENT_IP_HEADER')) errors.push('runtime contract must require explicit PCS_CLIENT_IP_HEADER');
if (contract.external_evidence_required.length < 6) errors.push('runtime external evidence list incomplete');

if (errors.length) {
  console.error(`Container runtime validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Container runtime validation passed: Next standalone/non-root packaging and smoke-test contract exist without claiming a deployed production environment.');
