import fs from 'node:fs';

const contract=JSON.parse(fs.readFileSync('data/legal/legal-disclosure-v0.1-dev.json','utf8'));
const inventory=JSON.parse(fs.readFileSync('data/privacy/data-inventory-v0.1-dev.json','utf8'));
const analytics=JSON.parse(fs.readFileSync('data/analytics/retention-policy-v0.1-dev.json','utf8'));
const retention=fs.readFileSync('docs/model/PERSISTENCE_RETENTION_BASELINE_v0.1.md','utf8');
const draft=fs.readFileSync('docs/legal/PUBLIC_LEGAL_DISCLOSURE_DRAFT_v0.1.md','utf8');
const deletion=JSON.parse(fs.readFileSync('data/privacy/user-deletion-v0.1-dev.json','utf8'));
const calibrationConsent=JSON.parse(fs.readFileSync('data/calibration/consent-purpose-v0.1-dev.json','utf8'));
const deletionRoute=fs.readFileSync('src/app/api/assessment/data/route.ts','utf8');
const privacyPage=fs.readFileSync('src/app/privacy/page.tsx','utf8');
const termsPage=fs.readFileSync('src/app/terms/page.tsx','utf8');
const landing=fs.readFileSync('src/app/page.tsx','utf8');
const legalE2e=fs.readFileSync('tests/e2e/legal-disclosure.spec.ts','utf8');
const errors=[];

if (contract.status !== 'draft-factual-disclosure' || contract.legally_approved !== false || contract.public_publish_ready !== false) errors.push('legal disclosure must remain draft/non-approved before release review');
if (contract.account_required !== inventory.account_required) errors.push('account-required disclosure drift');
if (contract.direct_identity_collection_default !== inventory.direct_identity_collection) errors.push('identity collection disclosure drift');
if (contract.precise_location_collection_default !== inventory.precise_location_collection) errors.push('location disclosure drift');
if (contract.third_party_diagnostic_export_default !== inventory.third_party_diagnostic_export_default) errors.push('third-party diagnostic export disclosure drift');
if (contract.current_engineering_retention.product_events_unscoped_days !== analytics.unscoped_retention_days) errors.push('unscoped analytics retention disclosure drift');
if (contract.current_engineering_retention.product_events_session_bound_days !== analytics.session_bound_retention_days) errors.push('session-bound analytics retention disclosure drift');
if (contract.anonymous_diagnostic_self_deletion_available !== true) errors.push('legal contract must disclose implemented anonymous self-deletion');
if (contract.anonymous_diagnostic_self_deletion_authentication !== deletion.ownership) errors.push('self-deletion ownership disclosure drift');
if (contract.anonymous_diagnostic_self_deletion_clears_cookie !== deletion.cookie_cleared_on_success) errors.push('self-deletion cookie-clearing disclosure drift');
if (!contract.anonymous_diagnostic_self_deletion_scope.includes('calibration-consent-receipts-if-present')) errors.push('legal deletion scope must include calibration consent receipt if present');
if (calibrationConsent.legal_approved !== false || calibrationConsent.collection_authorized !== false || calibrationConsent.export_authorized !== false) errors.push('legal draft must not imply calibration authorization');
if (calibrationConsent.current_runtime_collection_endpoint_exists !== false || calibrationConsent.current_runtime_export_job_exists !== false) errors.push('calibration runtime surface must remain absent');
if (!deletionRoute.includes('deleteAnonymousAssessmentDataByToken')) errors.push('self-deletion route implementation missing');

for (const [days,label] of [[30,'30 days'],[90,'90 days'],[180,'180 days']]) {
  if (!retention.includes(label)) errors.push(`persistence baseline missing ${label}`);
}

for (const fragment of [
  '医療・臨床診断ではありません',
  '診断を完了しただけでは結果は公開されません',
  '第三者analyticsへの診断データexportは標準で無効',
  '匿名診断データの自己削除を実行できます',
  '回答レベルのcalibration collection/exportは',
  'consent receipt保存構造',
  '法的助言または公開可能な最終約款を意味しません'
]) {
  if (!draft.includes(fragment)) errors.push(`legal draft missing required boundary: ${fragment}`);
}

if (JSON.stringify(contract.prelaunch_draft_routes_available)!==JSON.stringify(['/privacy','/terms'])) errors.push('prelaunch legal draft route contract drift');
if (contract.prelaunch_draft_routes_noindex_required !== true) errors.push('prelaunch legal draft routes must remain noindex');
for (const fragment of ['PRE-LAUNCH DRAFT','匿名診断データの自己削除','30日','90日','180日','production証拠は未完','consent receipt','runtime role']) if (!privacyPage.includes(fragment)) errors.push(`privacy draft page missing ${fragment}`);
for (const fragment of ['PRE-LAUNCH DRAFT','医療・臨床診断ではありません','public_use=false','64種類の自然な人格類型が実証されたという意味ではありません']) if (!termsPage.includes(fragment)) errors.push(`terms/limitations draft page missing ${fragment}`);
if (!privacyPage.includes('robots: { index: false, follow: false, nocache: true }') || !termsPage.includes('robots: { index: false, follow: false, nocache: true }')) errors.push('prelaunch legal draft routes must explicitly noindex');
if (!landing.includes('href="/privacy"') || !landing.includes('href="/terms"')) errors.push('landing must expose legal/privacy draft routes');
if (!legalE2e.includes('PRIVACY DRAFT') || !legalE2e.includes('TERMS / LIMITATIONS DRAFT')) errors.push('browser legal draft coverage missing');

for (const doc of contract.public_documents_required) { if (!doc || typeof doc !== 'string') errors.push('invalid public document requirement'); }
if (contract.release_review_required.length < 8) errors.push('release review blocker list is incomplete');

if (errors.length) {
  console.error(`Legal disclosure validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Legal disclosure draft validation passed: implementation-grounded /privacy and /terms drafts plus inventory/retention/share/analytics/self-deletion boundaries align; legal approval and public publish readiness remain false.');
