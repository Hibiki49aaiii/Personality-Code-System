import fs from 'node:fs';
import path from 'node:path';

const policy=JSON.parse(fs.readFileSync('data/security/runtime-log-policy-v0.1-dev.json','utf8'));
const loggerPath='src/server/privacySafeLog.ts';
const logger=fs.readFileSync(loggerPath,'utf8');
const errors=[];

if (policy.runtime_log_policy_version !== 'runtime-log-policy-v0.1-dev') errors.push('unexpected runtime log policy version');
if (policy.status !== 'repository-enforced-production-provider-pending') errors.push('runtime log policy status drift');
if (policy.production_provider_privacy_review_complete !== false) errors.push('production log-provider privacy review must remain pending');
if (JSON.stringify(policy.allowed_server_fault_fields)!==JSON.stringify(['event','surface','category'])) errors.push('server fault field allowlist drift');
if (policy.allowed_event_value !== 'pcs_server_fault') errors.push('server fault event name drift');

function walk(dir) {
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap((entry)=>{
    const full=path.join(dir,entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [full.replaceAll('\\','/')] : [];
  });
}

const runtimeFiles=walk('src');
const directConsole=[];
for (const file of runtimeFiles) {
  const source=fs.readFileSync(file,'utf8');
  if (source.includes('console.error(')) directConsole.push(file);
}
const expected=[...policy.direct_console_error_allowed_files].sort();
if (JSON.stringify(directConsole.sort())!==JSON.stringify(expected)) {
  errors.push(`direct console.error runtime files drift: ${directConsole.join(', ') || 'none'}`);
}

for (const fragment of [
  "event: 'pcs_server_fault'",
  'surface: input.surface',
  'category: input.category',
  'console.error(JSON.stringify({'
]) if (!logger.includes(fragment)) errors.push(`privacy-safe logger missing ${fragment}`);

for (const forbidden of ['error: unknown','Error','stack','request','headers','cookies','token','answer','trait','resultProse','message:']) {
  const signature=logger.slice(0,logger.indexOf('): void'));
  if (signature.includes(forbidden)) errors.push(`privacy-safe logger signature may accept forbidden payload class: ${forbidden}`);
}

if (!Array.isArray(policy.external_evidence_required) || policy.external_evidence_required.length < 5) errors.push('production log provider evidence list incomplete');

if (errors.length) {
  console.error(`Runtime log privacy validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Runtime log privacy validation passed: server faults use a fixed three-field schema and runtime source has no direct exception-object console logging outside the dedicated logger.');
