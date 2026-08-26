import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requirementsDir = path.join(root, 'docs', 'requirements');
const sources = [
  path.join(root, 'REQUIREMENTS.md'),
  ...fs.readdirSync(requirementsDir)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => path.join(requirementsDir, name))
];

const allowedMasterAliases = new Set([
  'PCS-SCORE-001',
  'PCS-SCORE-002',
  'PCS-SCORE-003',
  'PCS-SCORE-004',
  'PCS-SCORE-005',
  'PCS-SCORE-006',
  'PCS-RESULT-001',
  'PCS-RESULT-002',
  'PCS-RESULT-003',
  'PCS-RESULT-004',
  'PCS-RESULT-005'
]);

const declarationPattern = /^\s*-\s+\*\*(PCS-[A-Z0-9]+(?:-[A-Z0-9]+)*-\d{3})\b/gm;
const references = new Map();
const errors = [];

for (const absolutePath of sources) {
  const relativePath = path.relative(root, absolutePath).replaceAll('\\', '/');
  const text = fs.readFileSync(absolutePath, 'utf8');
  const seenInFile = new Set();
  let match;

  while ((match = declarationPattern.exec(text)) !== null) {
    const id = match[1];
    const line = text.slice(0, match.index).split('\n').length;

    if (seenInFile.has(id)) {
      errors.push(`${relativePath}:${line}: duplicate declaration of ${id} in the same document`);
      continue;
    }
    seenInFile.add(id);

    const entries = references.get(id) ?? [];
    entries.push({ file: relativePath, line });
    references.set(id, entries);
  }
}

for (const [id, entries] of references) {
  if (entries.length <= 1) continue;

  const files = new Set(entries.map((entry) => entry.file));
  const includesMaster = files.has('REQUIREMENTS.md');

  if (!includesMaster) {
    errors.push(`${id} is declared by multiple derivative documents: ${[...files].join(', ')}`);
    continue;
  }

  if (!allowedMasterAliases.has(id)) {
    errors.push(
      `${id} shadows a Master requirement without an explicit alias allowance: ${entries
        .map((entry) => `${entry.file}:${entry.line}`)
        .join(', ')}`
    );
    continue;
  }

  if (entries.length !== 2) {
    errors.push(`${id} is an allowed Master alias but is declared ${entries.length} times; expected exactly 2`);
  }
}

if (errors.length > 0) {
  console.error('Requirement ID validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const declarationCount = [...references.values()].reduce((sum, entries) => sum + entries.length, 0);
console.log(
  `Requirement ID validation passed: ${references.size} unique IDs / ${declarationCount} declarations across ${sources.length} authoritative documents.`
);
