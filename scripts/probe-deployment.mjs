import fs from 'node:fs';
import path from 'node:path';
import { evaluateDeploymentProbe, responseHeadersToObject } from './lib/deployment-probe.mjs';

const args=process.argv.slice(2);
const readArg=(name)=>{
  const i=args.indexOf(name);
  return i>=0 ? args[i+1] : undefined;
};
const baseUrl=readArg('--base-url') ?? process.env.PCS_PROBE_BASE_URL;
const environment=readArg('--environment') ?? 'preview';
const mode=readArg('--mode') ?? 'prelaunch';
const output=readArg('--output');

if (!baseUrl) {
  console.error('Usage: node scripts/probe-deployment.mjs --base-url https://example.test --environment preview|production --mode prelaunch|public [--output file.json]');
  process.exit(2);
}
if (!['preview','production'].includes(environment)) {
  console.error('Deployment probe environment must be preview or production');
  process.exit(2);
}
if (!['prelaunch','public'].includes(mode)) {
  console.error('Deployment probe mode must be prelaunch or public');
  process.exit(2);
}

const origin=new URL(baseUrl).origin;
async function fetchNormalized(route,{json=false}={}) {
  const response=await fetch(new URL(route,origin),{
    redirect:'manual',
    headers:{'User-Agent':'PCS-Release-Probe/0.1'}
  });
  const text=await response.text();
  let parsed=null;
  if (json) {
    try { parsed=JSON.parse(text); } catch {}
  }
  return {
    status:response.status,
    headers:responseHeadersToObject(response.headers),
    text,
    json:parsed
  };
}

let report;
try {
  const [health,landing,robots]=await Promise.all([
    fetchNormalized('/api/health',{json:true}),
    fetchNormalized('/'),
    fetchNormalized('/robots.txt')
  ]);
  report={
    ...evaluateDeploymentProbe({baseUrl:origin,environment,mode,health,landing,robots}),
    observed_at:new Date().toISOString(),
    source:'operator-run-provider-independent-http-probe'
  };
} catch (error) {
  report={
    probe_version:'deployment-probe-v0.1-dev',
    environment,
    mode,
    base_url:origin,
    observed_at:new Date().toISOString(),
    source:'operator-run-provider-independent-http-probe',
    passed:false,
    checks:[{name:'network-probe',passed:false,detail:error instanceof Error ? error.name : 'unknown-error'}]
  };
}

const serialized=JSON.stringify(report,null,2)+'\n';
process.stdout.write(serialized);
if (output) {
  const target=path.resolve(output);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,serialized,{mode:0o600});
}
process.exit(report.passed?0:1);
