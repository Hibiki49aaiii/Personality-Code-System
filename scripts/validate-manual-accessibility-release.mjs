import fs from 'node:fs';

const record=JSON.parse(fs.readFileSync('data/accessibility/manual-release-review-v0.1-dev.json','utf8'));
const manual=fs.readFileSync('docs/reviews/MANUAL_ACCESSIBILITY_RELEASE_QA_v0.1.md','utf8');
const responsive=fs.readFileSync('tests/e2e/responsive-accessibility.spec.ts','utf8');
const flow=fs.readFileSync('tests/e2e/assessment-flow.spec.ts','utf8');
const visual=fs.readFileSync('tests/e2e/visual-regression.spec.ts','utf8');
const errors=[];

if (record.review_record_version !== 'manual-accessibility-release-review-v0.1-dev') errors.push('unexpected accessibility review record version');
if (record.status !== 'not-run') errors.push('manual accessibility record must remain not-run until human evidence is recorded');
if (record.closure_allowed !== false) errors.push('manual accessibility closure must remain blocked');
if (record.master_requirements?.['PCS-A11Y-002'] !== 'open' || record.master_requirements?.['PCS-QA-005'] !== 'open') errors.push('manual accessibility master requirements must remain open');

const requiredClasses=[
  'desktop-screen-reader-keyboard',
  'mobile-screen-reader-touch',
  'browser-zoom-text-scaling',
  'reduced-motion-manual',
  'touch-only-mobile'
];
if (record.manual_classes?.length !== requiredClasses.length) errors.push('manual interaction-class count drift');
for (const id of requiredClasses) {
  const row=record.manual_classes?.find((entry)=>entry.id===id);
  if (!row) { errors.push(`missing manual class ${id}`); continue; }
  if (row.status !== 'pending') errors.push(`${id}: must remain pending until executed`);
  if (row.environment !== null || row.tester !== null || row.executed_at !== null) errors.push(`${id}: placeholder record must not fabricate execution evidence`);
}

for (const surface of ['landing','assessment','private-result','public-share','share-revoke-error','diagnostic-self-deletion']) {
  if (!record.required_surfaces?.includes(surface)) errors.push(`missing manual accessibility surface ${surface}`);
}
if (record.final_artwork_accessibility_review !== 'pending') errors.push('final artwork accessibility review must remain pending');
if (record.final_public_copy_wrapping_review !== 'pending') errors.push('final public copy wrapping review must remain pending');

for (const fragment of [
  'Status: **not yet executed**',
  'NVDA',
  'VoiceOver',
  'TalkBack',
  '診断データ',
  '削除を確定'
]) if (!manual.includes(fragment)) errors.push(`manual QA template missing ${fragment}`);

for (const fragment of ['200%','axe','keyboard','touch']) {
  if (!responsive.toLowerCase().includes(fragment.toLowerCase())) errors.push(`automated accessibility evidence missing ${fragment}`);
}
if (!flow.includes("name: '削除を確定'")) errors.push('self-deletion browser flow is not represented in current E2E');
if (!visual.includes('owner data-deletion panel')) errors.push('self-deletion visual baseline trigger/evidence missing');

if (errors.length) {
  console.error(`Manual accessibility release-gate validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Manual accessibility release-gate validation passed: automated prerequisites are referenced, all real assistive-tech/device evidence remains explicitly pending, and A11Y-002/QA-005 stay fail-closed.');
