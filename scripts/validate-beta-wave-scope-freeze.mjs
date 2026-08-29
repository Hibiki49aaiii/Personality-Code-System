import fs from 'node:fs';
import {
  SHA256_HEX_PATTERN,
  aggregateFileIdentities,
  inspectFileIdentity,
  verifyFrozenFileIdentities
} from './lib/file-identity.mjs';

const freeze=JSON.parse(fs.readFileSync('data/calibration/beta-wave-ja-01-scope-freeze-v0.1-dev.json','utf8'));
const wave=JSON.parse(fs.readFileSync('data/calibration/beta-wave-ja-01-draft.json','utf8'));
const protocol=JSON.parse(fs.readFileSync('data/calibration/beta-protocol-v0.1-dev.json','utf8'));
const consent=JSON.parse(fs.readFileSync('data/calibration/consent-purpose-v0.1-dev.json','utf8'));
const release=JSON.parse(fs.readFileSync('data/release/assessment-dev-v0.3.json','utf8'));
const code=JSON.parse(fs.readFileSync('data/code-schema/v0.1-dev.json','utf8'));
const releaseEvidence=JSON.parse(fs.readFileSync('data/release/release-evidence-contract-v0.1-dev.json','utf8'));
const baseItemManifest=JSON.parse(fs.readFileSync('data/item-bank/v0.1/manifest.json','utf8'));
const reviewedItemManifest=JSON.parse(fs.readFileSync('data/item-bank/v0.2/manifest.json','utf8'));
const errors=[];

const expectedPaths=[
  'data/release/assessment-dev-v0.3.json',
  'data/item-bank/v0.1/manifest.json',
  'data/item-bank/v0.1/cognitive.json',
  'data/item-bank/v0.1/affect-relational.json',
  'data/item-bank/v0.1/action-risk.json',
  'data/item-bank/v0.1/resilience-creativity.json',
  'data/item-bank/v0.2/manifest.json',
  'data/item-bank/v0.2/review.json',
  'docs/model/TRAIT_DICTIONARY_v0.2.md',
  'docs/model/SCORING_SPEC_v0.1.md',
  'src/domain/assessment/scoring.ts',
  'data/interactions/v0.1.json',
  'docs/model/TRAIT_INTERACTIONS_v0.1.md',
  'src/domain/assessment/interactions.ts',
  'data/code-schema/v0.1-dev.json'
];

if (freeze.scope_freeze_version!=='beta-wave-ja-01-scope-freeze-v0.1-dev') errors.push('unexpected scope freeze version');
if (freeze.wave_id!=='beta-ja-wave-01-draft') errors.push('scope freeze wave id drift');
if (freeze.status!=='repository-frozen-not-preregistered') errors.push('scope freeze status drift');
if (freeze.frozen_at_repository_level!==true) errors.push('repository freeze flag must be true');
if (freeze.external_preregistered!==false) errors.push('repository freeze must not claim external preregistration');
if (
  freeze.collection_enabled!==false
  || freeze.export_enabled!==false
  || freeze.collection_start_allowed!==false
) {
  errors.push('scope freeze must not enable calibration collection/export/start');
}

const expectedMeasurement={
  assessment_model_version:'assessment-dev-v0.3',
  item_bank_version:'item-bank-v0.2',
  scoring_version:'scoring-v0.1-dev',
  trait_dictionary_version:'trait-dictionary-v0.2',
  locale:'ja-JP',
  item_count:147,
  direct_trait_count:21
};
if (JSON.stringify(freeze.measurement_scope)!==JSON.stringify(expectedMeasurement)) {
  errors.push('measurement freeze tuple drift');
}

const expectedContext={
  code_schema_version:'core-code-v0.1-dev',
  interaction_version:'trait-interactions-v0.1',
  content_version:'content-dev-v0.3',
  code_schema_public_use:false
};
if (JSON.stringify(freeze.release_context)!==JSON.stringify(expectedContext)) {
  errors.push('release context freeze tuple drift');
}

if (
  freeze.digest_contract?.algorithm!=='sha256'
  || freeze.digest_contract?.entry_encoding!=='path + NUL + sha256 + LF'
  || freeze.digest_contract?.ordered_entries_required!==true
  || freeze.digest_contract?.duplicate_paths_allowed!==false
) {
  errors.push('scope freeze digest contract drift');
}
if (!SHA256_HEX_PATTERN.test(freeze.aggregate_sha256 ?? '')) errors.push('invalid aggregate sha256');

errors.push(...verifyFrozenFileIdentities(freeze,{expectedPaths}));

const waveExpected={
  assessment_model_version:freeze.measurement_scope.assessment_model_version,
  item_bank_version:freeze.measurement_scope.item_bank_version,
  scoring_version:freeze.measurement_scope.scoring_version,
  trait_dictionary_version:freeze.measurement_scope.trait_dictionary_version
};
if (JSON.stringify(wave.version_scope)!==JSON.stringify(waveExpected)) errors.push('wave/freeze measurement tuple drift');
if (wave.locale!==freeze.measurement_scope.locale) errors.push('wave/freeze locale drift');
if (wave.version_scope_frozen!==true) errors.push('Wave JA-01 version scope must be frozen');
if (wave.scope_freeze_ref!=='data/calibration/beta-wave-ja-01-scope-freeze-v0.1-dev.json') errors.push('wave scope-freeze ref drift');
if (wave.scope_freeze_aggregate_sha256!==freeze.aggregate_sha256) errors.push('wave/freeze aggregate sha256 drift');
if (
  wave.sample_size_plan?.preregistered!==false
  || wave.preregistration_document_ref!==null
  || protocol.wave_plan_foundation?.preregistered!==false
) {
  errors.push('scope freeze must not claim external preregistration');
}
if (
  wave.collection_enabled!==false
  || wave.export_enabled!==false
  || wave.collection_start_allowed!==false
  || protocol.collection_enabled!==false
  || protocol.export_enabled!==false
  || consent.collection_authorized!==false
  || consent.export_authorized!==false
) {
  errors.push('scope freeze must preserve fail-closed collection/export state');
}

if (
  release.model_version!==freeze.measurement_scope.assessment_model_version
  || release.locale!==freeze.measurement_scope.locale
  || release.item_count!==freeze.measurement_scope.item_count
  || release.versions.item_bank_version!==freeze.measurement_scope.item_bank_version
  || release.versions.scoring_version!==freeze.measurement_scope.scoring_version
  || release.versions.trait_dictionary_version!==freeze.measurement_scope.trait_dictionary_version
) {
  errors.push('assessment release/measurement freeze drift');
}
if (
  release.versions.code_schema_version!==freeze.release_context.code_schema_version
  || release.versions.interaction_version!==freeze.release_context.interaction_version
  || release.versions.content_version!==freeze.release_context.content_version
) {
  errors.push('assessment release/context freeze drift');
}
if (code.public_use!==false || freeze.release_context.code_schema_public_use!==false) {
  errors.push('development code schema must remain public_use=false');
}
if (!releaseEvidence.required_identity_files?.includes('data/calibration/beta-wave-ja-01-scope-freeze-v0.1-dev.json')) {
  errors.push('release evidence pack must include the beta scope-freeze manifest identity');
}
if (consent.scope_freeze_ref!=='data/calibration/beta-wave-ja-01-scope-freeze-v0.1-dev.json') {
  errors.push('consent contract scope-freeze reference drift');
}
if (protocol.wave_plan_foundation?.scope_freeze_aggregate_sha256!==freeze.aggregate_sha256) {
  errors.push('protocol/freeze aggregate sha256 drift');
}

const expectedBasePaths=baseItemManifest.files.map((name)=>`data/item-bank/v0.1/${name}`);
for (const p of expectedBasePaths) {
  if (!expectedPaths.includes(p)) errors.push(`base item source not frozen: ${p}`);
}
if (reviewedItemManifest.base_version!=='item-bank-v0.1' || reviewedItemManifest.review_file!=='review.json') {
  errors.push('reviewed item-bank materialization contract drift');
}
for (const p of ['data/item-bank/v0.1/manifest.json','data/item-bank/v0.2/manifest.json','data/item-bank/v0.2/review.json']) {
  if (!expectedPaths.includes(p)) errors.push(`reviewed item-bank input not frozen: ${p}`);
}

if (typeof freeze.amendment_rule!=='string' || !/new scope-freeze version|new wave/i.test(freeze.amendment_rule)) {
  errors.push('scope freeze amendment/new-wave rule missing');
}
for (const key of ['scientific_validation','production_model_approval','public_taxonomy_approval','external_preregistration']) {
  if (freeze.non_claims?.[key]!==false) errors.push(`scope freeze non-claim must remain false: ${key}`);
}

if (errors.length) {
  console.error(`Wave JA-01 scope-freeze validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const actual=freeze.files.map((entry)=>inspectFileIdentity(entry.path));
console.log(
  `Wave JA-01 repository scope freeze validated: ${actual.length} canonical files / aggregate ${aggregateFileIdentities(actual)}; external preregistration and collection/export remain disabled.`
);
