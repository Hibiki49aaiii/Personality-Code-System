import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const baseDir = path.join(root, 'data', 'item-bank', 'v0.1');
const reviewedDir = path.join(root, 'data', 'item-bank', 'v0.2');
const baseManifest = JSON.parse(await readFile(path.join(baseDir, 'manifest.json'), 'utf8'));
const reviewedManifest = JSON.parse(await readFile(path.join(reviewedDir, 'manifest.json'), 'utf8'));
const ledger = JSON.parse(await readFile(path.join(reviewedDir, reviewedManifest.review_file), 'utf8'));

const errors = [];
const baseItems = [];
for (const file of baseManifest.files) {
  const parsed = JSON.parse(await readFile(path.join(baseDir, file), 'utf8'));
  baseItems.push(...parsed);
}

const baseById = new Map(baseItems.map((item) => [item.id, item]));
if (baseById.size !== baseItems.length) errors.push('base bank contains duplicate IDs');
if (baseItems.length !== reviewedManifest.expected_total_items) {
  errors.push(`base item count ${baseItems.length} != reviewed expected ${reviewedManifest.expected_total_items}`);
}
if (ledger.source_version !== reviewedManifest.base_version) {
  errors.push(`ledger source_version ${ledger.source_version} != manifest base_version ${reviewedManifest.base_version}`);
}
if (ledger.reviewed_in !== reviewedManifest.item_bank_version) {
  errors.push(`ledger reviewed_in ${ledger.reviewed_in} != ${reviewedManifest.item_bank_version}`);
}

const dispositionById = new Map();
const reviewMetaById = new Map();

function assign(id, disposition, meta = {}) {
  if (!baseById.has(id)) {
    errors.push(`${id}: review references unknown base item`);
    return;
  }
  if (dispositionById.has(id)) {
    errors.push(`${id}: classified more than once (${dispositionById.get(id)} and ${disposition})`);
    return;
  }
  dispositionById.set(id, disposition);
  reviewMetaById.set(id, meta);
}

for (const [trait, ids] of Object.entries(ledger.accepted_by_trait ?? {})) {
  if (!reviewedManifest.trait_order.includes(trait)) errors.push(`accepted_by_trait: unknown trait ${trait}`);
  if (!Array.isArray(ids)) {
    errors.push(`accepted_by_trait.${trait}: must be an array`);
    continue;
  }
  for (const id of ids) {
    const base = baseById.get(id);
    if (base && base.primary_trait !== trait) {
      errors.push(`${id}: listed under ${trait} but base primary_trait is ${base.primary_trait}`);
    }
    assign(id, 'accept-r1');
  }
}

for (const entry of ledger.hold_for_beta ?? []) {
  if (!entry || typeof entry.id !== 'string') {
    errors.push('hold_for_beta: every entry requires id');
    continue;
  }
  if (!Array.isArray(entry.reason_codes) || entry.reason_codes.length === 0) {
    errors.push(`${entry.id}: hold-for-beta requires reason_codes`);
  }
  assign(entry.id, 'hold-for-beta', entry);
}

for (const entry of ledger.revisions ?? []) {
  if (!entry || typeof entry.id !== 'string') {
    errors.push('revisions: every entry requires id');
    continue;
  }
  if (entry.revision !== 'r2') errors.push(`${entry.id}: reviewed wording revision must be r2`);
  if (typeof entry.text !== 'string' || entry.text.trim().length < 12) errors.push(`${entry.id}: r2 text too short/invalid`);
  if (!Array.isArray(entry.reason_codes) || entry.reason_codes.length === 0) errors.push(`${entry.id}: revise-r2 requires reason_codes`);
  assign(entry.id, 'revise-r2', entry);
}

for (const id of baseById.keys()) {
  if (!dispositionById.has(id)) errors.push(`${id}: missing review disposition`);
}
if (dispositionById.size !== baseItems.length) {
  errors.push(`review coverage ${dispositionById.size} != base item count ${baseItems.length}`);
}

const expectedCounts = reviewedManifest.expected_review_counts;
const actualCounts = { 'accept-r1': 0, 'revise-r2': 0, 'hold-for-beta': 0 };
for (const disposition of dispositionById.values()) {
  if (!(disposition in actualCounts)) errors.push(`unknown disposition ${disposition}`);
  else actualCounts[disposition] += 1;
}
for (const [key, expected] of Object.entries(expectedCounts)) {
  if (actualCounts[key] !== expected) errors.push(`${key}: expected ${expected}, found ${actualCounts[key]}`);
}

const materialized = baseItems.map((base) => {
  const disposition = dispositionById.get(base.id);
  const meta = reviewMetaById.get(base.id) ?? {};
  const next = {
    ...base,
    status: 'reviewed',
    review_disposition: disposition,
    reviewed_in: reviewedManifest.item_bank_version
  };
  if (disposition === 'revise-r2') {
    next.revision = meta.revision;
    next.text = meta.text;
  }
  if (Array.isArray(meta.reason_codes)) next.review_reason_codes = meta.reason_codes;
  if (typeof meta.note === 'string') next.review_note = meta.note;
  return next;
});

const traitCounts = new Map(reviewedManifest.trait_order.map((trait) => [trait, { total: 0, positive: 0, reverse: 0 }]));
const seenTexts = new Map();
for (const item of materialized) {
  if (item.status !== 'reviewed') errors.push(`${item.id}: materialized status must be reviewed`);
  const base = baseById.get(item.id);
  if (item.primary_trait !== base.primary_trait) errors.push(`${item.id}: primary_trait changed during review`);
  if (item.direction !== base.direction) errors.push(`${item.id}: direction changed during review`);
  if (item.weight !== base.weight) errors.push(`${item.id}: weight changed during review`);
  if (item.review_disposition === 'revise-r2' && item.revision !== 'r2') errors.push(`${item.id}: revised item not r2`);
  if (item.review_disposition !== 'revise-r2' && item.revision !== 'r1') errors.push(`${item.id}: non-revised item changed revision`);

  const normalizedText = item.text.replace(/\s+/g, ' ').trim();
  if (seenTexts.has(normalizedText)) errors.push(`${item.id}: duplicate reviewed text with ${seenTexts.get(normalizedText)}`);
  else seenTexts.set(normalizedText, item.id);

  const bucket = traitCounts.get(item.primary_trait);
  if (!bucket) errors.push(`${item.id}: unknown trait ${item.primary_trait}`);
  else {
    bucket.total += 1;
    if (item.direction === 1) bucket.positive += 1;
    if (item.direction === -1) bucket.reverse += 1;
  }
}

for (const [trait, bucket] of traitCounts) {
  if (bucket.total !== reviewedManifest.expected_items_per_trait) errors.push(`${trait}: expected ${reviewedManifest.expected_items_per_trait}, found ${bucket.total}`);
  if (bucket.positive !== reviewedManifest.expected_direction_balance_per_trait.positive) errors.push(`${trait}: positive balance changed`);
  if (bucket.reverse !== reviewedManifest.expected_direction_balance_per_trait.reverse) errors.push(`${trait}: reverse balance changed`);
}

if (errors.length) {
  console.error(`Reviewed item-bank validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Reviewed item-bank validation passed: ${materialized.length} items.`);
console.log(`Dispositions: ${actualCounts['accept-r1']} accept-r1 / ${actualCounts['revise-r2']} revise-r2 / ${actualCounts['hold-for-beta']} hold-for-beta.`);
console.log('Trait, direction, and weight invariants preserved from item-bank-v0.1.');
