import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const errors = [];
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const nextConfig = fs.readFileSync('next.config.ts', 'utf8');

const runtimeDependencies = Object.keys(pkg.dependencies ?? {});
const prohibitedRuntimeDependencyPatterns = [
  /^openai$/i,
  /^@openai\//i,
  /^anthropic$/i,
  /^@anthropic-ai\//i,
  /^@ai-sdk\//i,
  /^ai$/i,
  /^langchain$/i,
  /^@langchain\//i,
  /^google-generativeai$/i,
  /^@google\/generative-ai$/i,
  /^cohere-ai$/i
];

for (const dependency of runtimeDependencies) {
  if (prohibitedRuntimeDependencyPatterns.some((pattern) => pattern.test(dependency))) {
    errors.push(`runtime AI dependency is prohibited: ${dependency}`);
  }
}

for (const requiredFragment of [
  'hidePoweredByHeader: true',
  'productionBrowserSourceMaps: false'
]) {
  if (!nextConfig.includes(requiredFragment)) {
    errors.push(`next.config.ts missing release-hardening setting: ${requiredFragment}`);
  }
}

const trackedFiles = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split('\n')
  .map((value) => value.trim())
  .filter(Boolean)
  .filter((file) => !file.startsWith('docs/'))
  .filter((file) => !file.startsWith('tests/'))
  .filter((file) => !file.endsWith('.png'))
  .filter((file) => !file.endsWith('.lock'));

const publicEnvPattern = /NEXT_PUBLIC_(?:DATABASE|DB|SECRET|TOKEN|PASSWORD|PRIVATE|RATE_LIMIT|OPENAI|ANTHROPIC|API_KEY)/i;
const obviousSecretPatterns = [
  /sk-proj-[A-Za-z0-9_-]{20,}/,
  /sk-[A-Za-z0-9_-]{32,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /postgres(?:ql)?:\/\/[^\s:'"`]+:[^\s@'"`]+@/i
];

for (const file of trackedFiles) {
  let stat;
  try {
    stat = fs.statSync(file);
  } catch {
    continue;
  }
  if (!stat.isFile() || stat.size > 1_000_000) continue;

  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  if (publicEnvPattern.test(content)) {
    errors.push(`${file}: server/private environment name is exposed through NEXT_PUBLIC_*`);
  }
  for (const pattern of obviousSecretPatterns) {
    if (pattern.test(content)) {
      errors.push(`${file}: potential committed secret matched ${pattern}`);
    }
  }
}

const sourceFiles = trackedFiles.filter((file) => file.startsWith('src/') && /\.(?:ts|tsx|js|jsx)$/.test(file));
const runtimeAiImportPattern = /(?:from\s+|require\s*\(|import\s*\()["'](?:openai|@openai\/|anthropic|@anthropic-ai\/|@ai-sdk\/|ai["']|langchain|@langchain\/|@google\/generative-ai)/i;
for (const file of sourceFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (runtimeAiImportPattern.test(content)) {
    errors.push(`${file}: runtime AI/LLM import is prohibited`);
  }
}

if (errors.length) {
  console.error(`Release security static audit failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Release security static audit passed: ${runtimeDependencies.length} runtime dependencies and ${trackedFiles.length} tracked non-doc/test files checked; no runtime AI dependency, public-secret env misuse or obvious committed secret detected.`);
