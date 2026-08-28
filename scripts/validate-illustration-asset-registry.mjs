import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { materializeIllustrationBriefs } from './materialize-illustration-briefs.mjs';
import { inspectImageBytes } from './lib/image-metadata.mjs';

const readJson=(p)=>JSON.parse(fs.readFileSync(p,'utf8'));
const contract=readJson('data/illustration/v0.1-dev/asset-ingest-contract.json');
const registry=readJson('data/illustration/v0.1-dev/asset-production-registry.json');
const briefSystem=readJson('data/illustration/v0.1-dev/brief-system.json');
const illustrationSystem=readJson('data/illustration/v0.1-dev/system.json');
const editorialManifest=readJson('data/type-catalog/v0.1-dev/editorial-catalog-manifest.ja.json');
const reachability=readJson('data/type-catalog/v0.1-dev/reachability.json');
const scaffold=readJson('data/type-catalog/v0.1-dev/editorial-scaffold.json');
const namingSystem=readJson('data/type-catalog/v0.1-dev/display-name-system.ja.json');
const primitives=readJson('data/type-catalog/v0.1-dev/editorial-primitives.ja.json');
const codeSchema=readJson('data/code-schema/v0.1-dev.json');

const briefs=materializeIllustrationBriefs({
  briefSystem, illustrationSystem, editorialManifest, reachability, scaffold, namingSystem, primitives, codeSchema
});
const briefByCode=new Map(briefs.entries.map((entry)=>[entry.core_code,entry]));
const errors=[];

const shaPattern=new RegExp(contract.master.sha256_pattern);
const allowedStatuses=new Set(contract.allowed_statuses);
const allowedMedia=new Set(contract.master.allowed_media_types);
const requiredVariants=contract.variants.required_for_approved;

if (contract.asset_ingest_contract_version!=='illustration-asset-ingest-v0.1-dev') errors.push('unexpected asset ingest contract version');
if (contract.public_use!==false || contract.runtime_generation!==false) errors.push('development asset ingest contract must remain non-public and non-runtime-generated');
if (registry.asset_ingest_contract_version!==contract.asset_ingest_contract_version) errors.push('registry/contract version mismatch');
if (registry.code_schema_version!==reachability.code_schema_version) errors.push('registry/code schema mismatch');
if (registry.public_use!==false) errors.push('development registry must remain public_use=false');
if (registry.entry_count!==64 || registry.entries.length!==64) errors.push('registry must contain exactly 64 entries');
if (JSON.stringify(registry.entries.map((e)=>e.core_code))!==JSON.stringify(reachability.core_codes)) errors.push('registry Core Code order/reachability drift');

const ids=new Set();
let producedCount=0;
let approvedCount=0;

function validateFileRef(ref,label,{variant=false,target=null}={}) {
  if (!ref || typeof ref!=='object') { errors.push(`${label}: file reference missing`); return; }
  if (typeof ref.path!=='string') errors.push(`${label}: path missing`);
  const prefix=variant ? contract.variants.path_prefix : contract.master.path_prefix;
  if (typeof ref.path==='string' && !ref.path.startsWith(prefix)) errors.push(`${label}: path must start with ${prefix}`);
  if (!shaPattern.test(ref.sha256??'')) errors.push(`${label}: invalid sha256`);
  if (!allowedMedia.has(ref.media_type)) errors.push(`${label}: unsupported media_type ${ref.media_type}`);
  if (ref.media_type!=='image/svg+xml') {
    if (!Number.isInteger(ref.width)||!Number.isInteger(ref.height)||ref.width<1||ref.height<1) errors.push(`${label}: positive raster dimensions required`);
    if (!variant && (ref.width<contract.master.raster_min_width||ref.height<contract.master.raster_min_height)) errors.push(`${label}: master raster below minimum dimensions`);
    if (variant && target && (ref.width!==target.width||ref.height!==target.height)) errors.push(`${label}: variant dimensions must be ${target.width}x${target.height}`);
  }
  if (ref.path && fs.existsSync(ref.path)) {
    const bytes=fs.readFileSync(ref.path);
    const digest=crypto.createHash('sha256').update(bytes).digest('hex');
    if (digest!==ref.sha256) errors.push(`${label}: committed file SHA-256 mismatch`);

    try {
      const actual=inspectImageBytes(bytes,ref.media_type);
      if (ref.width!==undefined && actual.width!==ref.width) errors.push(`${label}: declared width ${ref.width} != byte width ${actual.width}`);
      if (ref.height!==undefined && actual.height!==ref.height) errors.push(`${label}: declared height ${ref.height} != byte height ${actual.height}`);
      if (variant && target && (actual.width!==target.width||actual.height!==target.height)) {
        errors.push(`${label}: committed byte dimensions must be ${target.width}x${target.height}`);
      }
      if (!variant && ref.media_type!=='image/svg+xml' && (actual.width<contract.master.raster_min_width||actual.height<contract.master.raster_min_height)) {
        errors.push(`${label}: committed master bytes below minimum dimensions`);
      }
    } catch (error) {
      errors.push(`${label}: image-byte metadata invalid: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else if (ref.path) {
    errors.push(`${label}: referenced file does not exist in repository`);
  }
}

for (const entry of registry.entries) {
  const brief=briefByCode.get(entry.core_code);
  if (!brief) { errors.push(`${entry.core_code}: missing production brief`); continue; }
  if (entry.asset_id!==brief.asset_id) errors.push(`${entry.core_code}: asset ID drift`);
  if (ids.has(entry.asset_id)) errors.push(`${entry.core_code}: duplicate asset ID`);
  ids.add(entry.asset_id);
  if (!allowedStatuses.has(entry.status)) errors.push(`${entry.core_code}: invalid status ${entry.status}`);
  if (entry.public_use!==false) errors.push(`${entry.core_code}: C01D registry entry must remain public_use=false`);

  const unproduced=entry.status==='unproduced';
  if (unproduced) {
    if (entry.master!==null || entry.provenance!==null) errors.push(`${entry.core_code}: unproduced entry cannot claim master/provenance`);
    for (const key of requiredVariants) if (entry.variants?.[key]!==null) errors.push(`${entry.core_code}: unproduced variant ${key} must be null`);
    if (entry.approval?.reviewer!==null || entry.approval?.reviewed_at!==null) errors.push(`${entry.core_code}: unproduced entry cannot claim reviewer/date`);
    if (Object.values(entry.approval?.checks??{}).some(Boolean)) errors.push(`${entry.core_code}: unproduced review checks must remain false`);
    continue;
  }

  producedCount+=1;
  validateFileRef(entry.master,`${entry.core_code}/master`);

  const p=entry.provenance;
  if (!p || !contract.provenance.production_methods.includes(p.production_method)) errors.push(`${entry.core_code}: valid production_method required`);
  for (const key of contract.provenance.required_fields) if (p?.[key]===undefined||p?.[key]===null||p?.[key]==='') errors.push(`${entry.core_code}: provenance ${key} required`);
  if (p?.production_method==='generative-development-curated' && p?.human_curated!==true) errors.push(`${entry.core_code}: generative development asset must be human curated`);
  if (p?.human_curated!==true) errors.push(`${entry.core_code}: all produced assets require explicit human curation`);

  if (entry.status==='approved') {
    approvedCount+=1;
    for (const key of requiredVariants) {
      const ref=entry.variants?.[key];
      validateFileRef(ref,`${entry.core_code}/${key}`,{variant:true,target:contract.variants.targets[key]});
      if (ref?.source_master_asset_id!==entry.asset_id) errors.push(`${entry.core_code}/${key}: source_master_asset_id mismatch`);
    }
    if (!entry.approval?.reviewer || !entry.approval?.reviewed_at) errors.push(`${entry.core_code}: approved asset needs reviewer/date`);
    if (entry.approval?.reviewed_at && Number.isNaN(Date.parse(entry.approval.reviewed_at))) errors.push(`${entry.core_code}: invalid approval date`);
    const checkKeys=briefSystem.review_checks;
    if (JSON.stringify(Object.keys(entry.approval?.checks??{}))!==JSON.stringify(checkKeys)) errors.push(`${entry.core_code}: approval check keys drift`);
    for (const key of checkKeys) if (entry.approval?.checks?.[key]!==true) errors.push(`${entry.core_code}: approved asset missing check ${key}`);
  }
}

if (ids.size!==64) errors.push('asset registry IDs must be unique across 64 slots');

const currentlyAllUnproduced=registry.entries.every((entry)=>entry.status==='unproduced');
if (registry.status==='all-slots-unproduced' && !currentlyAllUnproduced) errors.push('registry summary status no longer matches entries');
if (currentlyAllUnproduced && (producedCount!==0||approvedCount!==0)) errors.push('current unproduced registry count invariant failed');

if (errors.length) {
  console.error(`Illustration asset production registry validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Illustration asset registry validation passed: 64 exact C01D slots tracked, produced=${producedCount}, approved=${approvedCount}; any future produced asset must have committed bytes, SHA-256, dimensions, provenance, deterministic variants and human review evidence.`);
