import fs from 'node:fs';
import path from 'node:path';

const root = '.next';
if (!fs.existsSync(root)) {
  throw new Error('.next build output is required before running the production-build audit');
}

const errors = [];
const staticRoot = path.join(root, 'static');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const staticFiles = walk(staticRoot);
const sourceMaps = staticFiles.filter((file) => file.endsWith('.map'));
if (sourceMaps.length > 0) {
  errors.push(`browser source maps found in production static output: ${sourceMaps.slice(0, 5).join(', ')}`);
}

const forbiddenClientStrings = [
  'DATABASE_URL',
  'PCS_RATE_LIMIT_SECRET',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  process.env.DATABASE_URL,
  process.env.PCS_RATE_LIMIT_SECRET,
  process.env.OPENAI_API_KEY,
  process.env.ANTHROPIC_API_KEY
].filter((value) => typeof value === 'string' && value.length >= 8);

for (const file of staticFiles) {
  const stat = fs.statSync(file);
  if (stat.size > 5_000_000) continue;

  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  for (const forbidden of forbiddenClientStrings) {
    if (content.includes(forbidden)) {
      errors.push(`${file}: client bundle contains a forbidden server-only identifier or configured secret value`);
    }
  }
}

const buildManifestCandidates = [
  '.next/build-manifest.json',
  '.next/app-build-manifest.json'
];
for (const manifest of buildManifestCandidates) {
  if (!fs.existsSync(manifest)) continue;
  const content = fs.readFileSync(manifest, 'utf8');
  if (/\.map(?:"|')/.test(content)) {
    errors.push(`${manifest}: source-map asset reference found`);
  }
}

if (errors.length) {
  console.error(`Production build privacy audit failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Production build privacy audit passed: ${staticFiles.length} client static files checked; no browser source maps or server-only secret identifiers/configured secret values exposed.`);
