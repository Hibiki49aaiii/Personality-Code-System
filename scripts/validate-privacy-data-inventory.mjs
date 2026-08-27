import fs from 'node:fs';
import path from 'node:path';

const inventory = JSON.parse(
  fs.readFileSync('data/privacy/data-inventory-v0.1-dev.json', 'utf8')
);
const errors = [];

if (inventory.inventory_version !== 'privacy-data-inventory-v0.1-dev') {
  errors.push('unexpected privacy data inventory version');
}
if (inventory.account_required !== false) errors.push('anonymous assessment must remain account-free by default');
if (inventory.direct_identity_collection !== false) errors.push('direct identity collection must remain disabled by default');
if (inventory.precise_location_collection !== false) errors.push('precise location collection must remain disabled by default');
if (inventory.third_party_diagnostic_export_default !== false) {
  errors.push('third-party diagnostic export must remain disabled by default');
}

const migrationDir = 'drizzle';
const migrationFiles = fs.readdirSync(migrationDir)
  .filter((file) => /^\d+_.*\.sql$/i.test(file))
  .sort();
const sqlText = migrationFiles
  .map((file) => fs.readFileSync(path.join(migrationDir, file), 'utf8'))
  .join('\n');

const actualTables = [...sqlText.matchAll(/CREATE TABLE\s+([a-z_][a-z0-9_]*)\b/gi)]
  .map((match) => match[1])
  .sort();
const inventoriedTables = inventory.classes
  .flatMap((entry) => entry.tables ?? [])
  .sort();

const duplicates = inventoriedTables.filter((table, index) => inventoriedTables.indexOf(table) !== index);
for (const duplicate of [...new Set(duplicates)]) {
  errors.push(`table appears in more than one privacy class: ${duplicate}`);
}

for (const table of actualTables) {
  if (!inventoriedTables.includes(table)) errors.push(`database table missing from privacy inventory: ${table}`);
}
for (const table of inventoriedTables) {
  if (!actualTables.includes(table)) errors.push(`privacy inventory references unknown database table: ${table}`);
}

for (const entry of inventory.classes ?? []) {
  if (!entry.id || !entry.purpose || !entry.retention) {
    errors.push(`privacy class is missing id/purpose/retention: ${JSON.stringify(entry)}`);
  }
  if (!Array.isArray(entry.tables) || entry.tables.length === 0) {
    errors.push(`${entry.id ?? 'unknown'}: privacy class must map at least one table`);
  }
  if (entry.public_by_default !== false) {
    errors.push(`${entry.id}: database-backed data classes may not be public by default`);
  }
  if (entry.third_party_export_default !== false) {
    errors.push(`${entry.id}: third-party export must be disabled by default`);
  }
}

const sourceRoots = ['src/app', 'src/server'];
const sourceFiles = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(?:ts|tsx|js|jsx)$/.test(entry.name)) sourceFiles.push(full);
  }
}
for (const root of sourceRoots) walk(root);

const prohibitedCollectionPatterns = [
  ['email form input', /type\s*=\s*["']email["']/i],
  ['telephone form input', /type\s*=\s*["']tel["']/i],
  ['precise geolocation API', /navigator\.geolocation\b/i],
  ['camera or microphone capture', /getUserMedia\s*\(/i],
  ['contact picker API', /navigator\.contacts\b/i]
];

for (const file of sourceFiles) {
  const content = fs.readFileSync(file, 'utf8');
  for (const [label, pattern] of prohibitedCollectionPatterns) {
    if (pattern.test(content)) errors.push(`${file}: prohibited default collection capability detected (${label})`);
  }
}

if (errors.length) {
  console.error(`Privacy data-inventory validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Privacy data-inventory validation passed: ${actualTables.length} database tables mapped exactly once across ${inventory.classes.length} purpose/retention classes; no default identity/location/media collection capability detected.`);
