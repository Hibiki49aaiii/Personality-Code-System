import assert from 'node:assert/strict';
import fs from 'node:fs';

const readJson=(path)=>JSON.parse(fs.readFileSync(path,'utf8'));

const batch=readJson('data/illustration/v0.1-dev/production-batch-a.json');
const reachability=readJson('data/type-catalog/v0.1-dev/reachability.json');
const briefSystem=readJson('data/illustration/v0.1-dev/brief-system.json');
const artDirection=readJson('data/illustration/v0.1-dev/art-direction-reference-v0.2.json');
const ingest=readJson('data/illustration/v0.1-dev/asset-ingest-contract.json');

assert.equal(batch.batch_version,'illustration-production-batch-a-v0.1-dev');
assert.equal(batch.art_direction_version,'illustration-art-direction-reference-v0.2-dev');
assert.equal(batch.art_direction_version,artDirection.reference_set_version);
assert.equal(artDirection.status,'owner-approved-art-direction');
assert.equal(artDirection.approval?.approved,true);
assert.equal(artDirection.approval?.scope,'art-direction-only');
assert.equal(batch.public_use,false);
assert.equal(batch.runtime_generation,false);
assert.equal(batch.production_method,'generative-development-curated');
assert.equal(batch.human_curated_required,true);
assert.equal(batch.entries.length,8);
assert.equal(batch.master_contract.minimum_width,ingest.master.raster_min_width);
assert.equal(batch.master_contract.minimum_height,ingest.master.raster_min_height);
assert.equal(batch.master_contract.localized_text_baked_in,false);
assert.equal(batch.master_contract.registry_status_after_ingest,'review-required');
assert.equal(batch.master_contract.public_use,false);

for (const media of batch.master_contract.preferred_media_types) {
  assert.ok(ingest.master.allowed_media_types.includes(media),`unsupported preferred master media type ${media}`);
}

const expectedRoles=['LTG','LTA','LVG','LVA','STG','STA','SVG','SVA'];
const expectedActions=['PF','PN','EF','EN'];
const expectedRelations=['B','D'];
const roles=[];
const offsets=[];
const representations=[];
const sceneCategories=[];
const signatures=[];
const actions=new Map(expectedActions.map((key)=>[key,0]));
const relations=new Map(expectedRelations.map((key)=>[key,0]));

for (const entry of batch.entries) {
  assert.ok(reachability.core_codes.includes(entry.core_code),`${entry.core_code}: unreachable Core Code`);
  const index=reachability.core_codes.indexOf(entry.core_code);
  const role=entry.core_code.slice(0,3);
  const action=entry.core_code.slice(3,5);
  const relationship=entry.core_code.slice(5);
  const offset=index%briefSystem.representation_rotation.length;
  const representation=briefSystem.representation_rotation[offset];

  assert.equal(entry.role,role,`${entry.core_code}: role mismatch`);
  assert.equal(entry.action,action,`${entry.core_code}: action mismatch`);
  assert.equal(entry.relationship,relationship,`${entry.core_code}: relationship mismatch`);
  assert.equal(entry.catalog_combo_offset,offset,`${entry.core_code}: catalog combo offset mismatch`);
  assert.equal(entry.representation_variant,representation,`${entry.core_code}: representation rotation mismatch`);
  assert.equal(entry.representation_basis,'catalog-index-rotation-only',`${entry.core_code}: representation basis drift`);
  assert.equal(entry.asset_id,`ILL-C01D-${entry.core_code}-HERO-v01`,`${entry.core_code}: asset ID mismatch`);
  assert.equal(entry.status,'planned',`${entry.core_code}: Batch A entry must remain planned before real asset ingest`);
  assert.ok(typeof entry.scene_category==='string' && entry.scene_category.length>0,`${entry.core_code}: scene category required`);
  assert.ok(typeof entry.pose_composition==='string' && entry.pose_composition.length>0,`${entry.core_code}: pose composition required`);
  assert.ok(typeof entry.scene_direction==='string' && entry.scene_direction.length>0,`${entry.core_code}: scene direction required`);
  assert.ok(Array.isArray(entry.motif_usage) && entry.motif_usage.length>=3,`${entry.core_code}: motif usage too sparse`);
  assert.ok(Array.isArray(entry.avoid) && entry.avoid.length>=4,`${entry.core_code}: anti-repeat avoid list too sparse`);
  assert.ok(typeof entry.anti_repeat_signature==='string' && entry.anti_repeat_signature.length>0,`${entry.core_code}: anti-repeat signature required`);

  roles.push(role);
  offsets.push(offset);
  representations.push(representation);
  sceneCategories.push(entry.scene_category);
  signatures.push(entry.anti_repeat_signature);
  actions.set(action,(actions.get(action)??0)+1);
  relations.set(relationship,(relations.get(relationship)??0)+1);
}

assert.deepEqual([...roles].sort(),[...expectedRoles].sort(),'Batch A must cover all eight role families exactly once');
assert.deepEqual([...offsets].sort((a,b)=>a-b),[0,1,2,3,4,5,6,7],'Batch A must use every catalog combo offset exactly once');
assert.equal(new Set(representations).size,8,'Batch A must cover all eight editorial representation rotation slots exactly once');
assert.equal(new Set(sceneCategories).size,8,'Batch A scene categories must be distinct');
assert.equal(new Set(signatures).size,8,'Batch A anti-repeat signatures must be distinct');
for (const action of expectedActions) assert.equal(actions.get(action),2,`Batch A action ${action} must appear exactly twice`);
for (const relation of expectedRelations) assert.equal(relations.get(relation),4,`Batch A relationship ${relation} must appear exactly four times`);

assert.deepEqual(batch.selection_policy.combo_offsets_used_exactly_once,[0,1,2,3,4,5,6,7]);
assert.deepEqual(batch.selection_policy.action_coverage,{PF:2,PN:2,EF:2,EN:2});
assert.deepEqual(batch.selection_policy.relationship_coverage,{B:4,D:4});
assert.equal(batch.selection_policy.representation_is_not_personality_derived,true);
assert.equal(batch.batch_gate.must_pass_before_remaining_56,true);
assert.ok(batch.batch_gate.required_human_checks.includes('no-ai-template-repetition'));
assert.ok(batch.batch_gate.required_human_checks.includes('no-prestige-hierarchy'));

for (const key of [
  'character_first',
  'believable_lived_in_scene',
  'natural_asymmetry',
  'motivated_available_light',
  'scene_native_props_only',
  'avoid_generic_beauty_portrait',
  'avoid_repeated_chin_in_hand_pose',
  'avoid_fantasy_scholar_atelier_template',
  'avoid_universal_golden_hour',
  'avoid_prompt_collage',
  'avoid_pseudo_text'
]) assert.equal(batch.shared_direction[key],true,`Batch A shared direction guard ${key} must be true`);

console.log('Illustration production Batch A validation passed: 8 role anchors, balanced PF/PN/EF/EN + B/D coverage, all 8 editorial representation slots exactly once, distinct scene/pose signatures, v0.2 owner-approved art direction, non-public/runtime-generation-disabled boundaries preserved.');
