import fs from 'node:fs';

const contract=JSON.parse(fs.readFileSync('data/legal/legal-disclosure-v0.1-dev.json','utf8'));
const inventory=JSON.parse(fs.readFileSync('data/privacy/data-inventory-v0.1-dev.json','utf8'));
const analytics=JSON.parse(fs.readFileSync('data/analytics/retention-policy-v0.1-dev.json','utf8'));
const retention=fs.readFileSync('docs/model/PERSISTENCE_RETENTION_BASELINE_v0.1.md','utf8');
const draft=fs.readFileSync('docs/legal/PUBLIC_LEGAL_DISCLOSURE_DRAFT_v0.1.md','utf8');
const errors=[];

if (contract.status !== 'draft-factual-disclosure' || contract.legally_approved !== false || contract.public_publish_ready !== false) errors.push('legal disclosure must remain draft/non-approved before release review');
if (contract.account_required !== inventory.account_required) errors.push('account-required disclosure drift');
if (contract.direct_identity_collection_default !== inventory.direct_identity_collection) errors.push('identity collection disclosure drift');
if (contract.precise_location_collection_default !== inventory.precise_location_collection) errors.push('location disclosure drift');
if (contract.third_party_diagnostic_export_default !== inventory.third_party_diagnostic_export_default) errors.push('third-party diagnostic export disclosure drift');
if (contract.current_engineering_retention.product_events_unscoped_days !== analytics.unscoped_retention_days) errors.push('unscoped analytics retention disclosure drift');
if (contract.current_engineering_retention.product_events_session_bound_days !== analytics.session_bound_retention_days) errors.push('session-bound analytics retention disclosure drift');

for (const [days,label] of [[30,'30 days'],[90,'90 days'],[180,'180 days']]) {
  if (!retention.includes(label)) errors.push(`persistence baseline missing ${label}`);
}

for (const fragment of [
  '医療・臨床診断ではありません',
  '診断を完了しただけでは結果は公開されません',
  '第三者analyticsへの診断データexportは標準で無効',
  'calibration exportは、明示的な参加/同意',
  '法的助言または公開可能な最終約款を意味しません'
]) {
  if (!draft.includes(fragment)) errors.push(`legal draft missing required boundary: ${fragment}`);
}

for (const doc of contract.public_documents_required) { if (!doc || typeof doc !== 'string') errors.push('invalid public document requirement'); }
if (contract.release_review_required.length < 6) errors.push('release review blocker list is incomplete');

if (errors.length) {
  console.error(`Legal disclosure validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Legal disclosure draft validation passed: current data inventory/retention/share/analytics boundaries align; legal approval and public publish readiness remain false.');
