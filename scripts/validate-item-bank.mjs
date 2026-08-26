import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const bankDir = path.join(root, 'data', 'item-bank', 'v0.1');
const manifest = JSON.parse(await readFile(path.join(bankDir, 'manifest.json'), 'utf8'));

const requiredFields = [
  'id',
  'revision',
  'locale',
  'primary_trait',
  'direction',
  'weight',
  'status',
  'text',
  'rationale',
  'discriminates',
  'introduced'
];
const allowedStatuses = new Set(['draft', 'reviewed', 'beta', 'active', 'retired']);
const traitSet = new Set(manifest.trait_order);
const allItems = [];
const errors = [];

for (const file of manifest.files) {
  const fullPath = path.join(bankDir, file);
  let parsed;
  try {
    parsed = JSON.parse(await readFile(fullPath, 'utf8'));
  } catch (error) {
    errors.push(`${file}: invalid/unreadable JSON: ${error.message}`);
    continue;
  }
  if (!Array.isArray(parsed)) {
    errors.push(`${file}: root must be an array`);
    continue;
  }
  allItems.push(...parsed.map((item) => ({ ...item, __file: file })));
}

const seenIds = new Set();
const seenTexts = new Map();
const counts = new Map(manifest.trait_order.map((trait) => [trait, { total: 0, positive: 0, reverse: 0 }]));

for (const item of allItems) {
  for (const field of requiredFields) {
    if (!(field in item)) errors.push(`${item.id ?? item.__file}: missing field ${field}`);
  }

  if (!/^PCS-[A-Z]+-\d{3}$/.test(item.id ?? '')) errors.push(`${item.id ?? item.__file}: invalid id format`);
  if (seenIds.has(item.id)) errors.push(`${item.id}: duplicate id`);
  seenIds.add(item.id);

  if (!traitSet.has(item.primary_trait)) errors.push(`${item.id}: unknown primary_trait ${item.primary_trait}`);
  if (item.locale !== manifest.locale) errors.push(`${item.id}: locale ${item.locale} != ${manifest.locale}`);
  if (!['r1'].includes(item.revision)) errors.push(`${item.id}: unexpected revision ${item.revision}`);
  if (![1, -1].includes(item.direction)) errors.push(`${item.id}: direction must be 1 or -1`);
  if (typeof item.weight !== 'number' || item.weight <= 0) errors.push(`${item.id}: weight must be > 0`);
  if (!allowedStatuses.has(item.status)) errors.push(`${item.id}: invalid status ${item.status}`);
  if (typeof item.text !== 'string' || item.text.trim().length < 12) errors.push(`${item.id}: item text too short/invalid`);
  if (typeof item.rationale !== 'string' || item.rationale.trim().length === 0) errors.push(`${item.id}: rationale required`);
  if (!Array.isArray(item.discriminates)) errors.push(`${item.id}: discriminates must be an array`);
  if (item.introduced !== manifest.item_bank_version) errors.push(`${item.id}: introduced must equal ${manifest.item_bank_version}`);

  if (Array.isArray(item.discriminates)) {
    for (const target of item.discriminates) {
      if (!traitSet.has(target)) errors.push(`${item.id}: unknown discriminant target ${target}`);
      if (target === item.primary_trait) errors.push(`${item.id}: cannot discriminate against itself`);
    }
  }

  const normalizedText = String(item.text ?? '').replace(/\s+/g, ' ').trim();
  if (seenTexts.has(normalizedText)) errors.push(`${item.id}: duplicate text with ${seenTexts.get(normalizedText)}`);
  else seenTexts.set(normalizedText, item.id);

  const bucket = counts.get(item.primary_trait);
  if (bucket) {
    bucket.total += 1;
    if (item.direction === 1) bucket.positive += 1;
    if (item.direction === -1) bucket.reverse += 1;
  }
}

if (traitSet.size !== manifest.expected_trait_count) {
  errors.push(`manifest: expected ${manifest.expected_trait_count} traits, found ${traitSet.size}`);
}
if (allItems.length !== manifest.expected_total_items) {
  errors.push(`item count: expected ${manifest.expected_total_items}, found ${allItems.length}`);
}

for (const [trait, bucket] of counts) {
  if (bucket.total !== manifest.expected_items_per_trait) {
    errors.push(`${trait}: expected ${manifest.expected_items_per_trait} items, found ${bucket.total}`);
  }
  if (bucket.positive !== manifest.expected_direction_balance_per_trait.positive) {
    errors.push(`${trait}: expected ${manifest.expected_direction_balance_per_trait.positive} positive items, found ${bucket.positive}`);
  }
  if (bucket.reverse !== manifest.expected_direction_balance_per_trait.reverse) {
    errors.push(`${trait}: expected ${manifest.expected_direction_balance_per_trait.reverse} reverse items, found ${bucket.reverse}`);
  }
}

const highOverlapPairs = [
  ['VER', 'ADV'],
  ['EMO', 'COG'],
  ['OPT', 'FIN'],
  ['RSK', 'UNC']
];
for (const [a, b] of highOverlapPairs) {
  const aCount = allItems.filter((item) => item.primary_trait === a && item.discriminates?.includes(b)).length;
  const bCount = allItems.filter((item) => item.primary_trait === b && item.discriminates?.includes(a)).length;
  if (aCount < 2) errors.push(`${a}: requires at least 2 discriminant items against high-overlap ${b}; found ${aCount}`);
  if (bCount < 2) errors.push(`${b}: requires at least 2 discriminant items against high-overlap ${a}; found ${bCount}`);
}

if (errors.length) {
  console.error(`Item-bank validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Item-bank validation passed: ${allItems.length} items / ${traitSet.size} traits.`);
for (const trait of manifest.trait_order) {
  const bucket = counts.get(trait);
  console.log(`${trait}: ${bucket.total} items (${bucket.positive} positive / ${bucket.reverse} reverse)`);
}
