import { cp, mkdir, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const standaloneDir = '.next/standalone';
const staticSource = '.next/static';
const staticTarget = '.next/standalone/.next/static';
const publicSource = 'public';
const publicTarget = '.next/standalone/public';

await stat(`${standaloneDir}/server.js`);
await stat(staticSource);
await mkdir('.next/standalone/.next', { recursive: true });
await cp(staticSource, staticTarget, { recursive: true, force: true });
try {
  await stat(publicSource);
  await cp(publicSource, publicTarget, { recursive: true, force: true });
} catch {}

const port = 3100;
const child = spawn(process.execPath, ['server.js'], {
  cwd: standaloneDir,
  env: {
    ...process.env,
    NODE_ENV: 'production',
    HOSTNAME: '127.0.0.1',
    PORT: String(port)
  },
  stdio: ['ignore', 'pipe', 'pipe']
});

let stderr='';
child.stderr.on('data',(chunk)=>{ stderr += String(chunk); });

async function fetchWithRetry(url, attempts=40) {
  let lastError;
  for (let index=0; index<attempts; index+=1) {
    try {
      return await fetch(url, { redirect: 'manual' });
    } catch (error) {
      lastError=error;
      await new Promise((resolve)=>setTimeout(resolve,250));
    }
  }
  throw lastError;
}

try {
  const health=await fetchWithRetry(`http://127.0.0.1:${port}/api/health`);
  if (health.status !== 200) {
    throw new Error(`standalone health returned ${health.status}: ${await health.text()}`);
  }
  const healthBody=await health.json();
  if (healthBody?.status !== 'ok') throw new Error('standalone health payload is not ok');

  const landing=await fetchWithRetry(`http://127.0.0.1:${port}/`);
  if (landing.status !== 200) throw new Error(`standalone landing returned ${landing.status}`);
  const html=await landing.text();
  if (!html.includes('あなたを、16種類では終わらせない。')) {
    throw new Error('standalone landing does not contain the reviewed PCS headline');
  }

  const staticMatch=html.match(/(?:src|href)="([^"]*\/_next\/static\/[^"]+)"/);
  if (!staticMatch) throw new Error('standalone landing did not reference a Next static asset');
  const staticResponse=await fetchWithRetry(new URL(staticMatch[1], `http://127.0.0.1:${port}`).toString());
  if (staticResponse.status !== 200) throw new Error(`standalone static asset returned ${staticResponse.status}`);

  console.log(JSON.stringify({
    runtime:'next-standalone',
    health:healthBody.status,
    landingStatus:landing.status,
    staticAssetStatus:staticResponse.status,
    rootUser:false
  },null,2));
} finally {
  child.kill('SIGTERM');
  await new Promise((resolve)=>{
    const timer=setTimeout(resolve,3000);
    child.once('exit',()=>{ clearTimeout(timer); resolve(); });
  });
}

// Next standalone may translate the intentional SIGTERM shutdown to conventional
// process exit code 143 instead of exposing signalCode=SIGTERM to this parent.
const expectedShutdown =
  child.exitCode === 0 ||
  child.exitCode === 143 ||
  child.signalCode === 'SIGTERM';
if (!expectedShutdown) {
  throw new Error(`standalone server exited unexpectedly: ${child.exitCode}\n${stderr}`);
}
