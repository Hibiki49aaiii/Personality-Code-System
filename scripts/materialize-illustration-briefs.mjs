import { materializeIllustrationSlots } from './materialize-illustration-slots.mjs';
import { materializeTypeEditorialCatalog } from './materialize-type-editorial-catalog.mjs';

export function materializeIllustrationBriefs({
  briefSystem,
  illustrationSystem,
  editorialManifest,
  reachability,
  scaffold,
  namingSystem,
  primitives,
  codeSchema
}) {
  if (briefSystem.illustration_system_version !== illustrationSystem.illustration_system_version) {
    throw new Error('illustration brief/system version mismatch');
  }
  if (briefSystem.editorial_catalog_version !== editorialManifest.editorial_catalog_version) {
    throw new Error('illustration brief/editorial catalog version mismatch');
  }
  if (briefSystem.public_use !== false || briefSystem.runtime_generation !== false) {
    throw new Error('development illustration briefs must remain non-public and non-runtime-generated');
  }

  const slots = materializeIllustrationSlots({ reachability, illustrationSystem });
  const editorial = materializeTypeEditorialCatalog({
    manifest: editorialManifest,
    reachability,
    scaffold,
    namingSystem,
    primitives,
    codeSchema
  });
  const editorialByCode = new Map(editorial.entries.map((entry) => [entry.core_code, entry]));

  const entries = slots.entries.map((slot, index) => {
    const type = editorialByCode.get(slot.core_code);
    if (!type) throw new Error(`${slot.core_code}: missing editorial entry for illustration brief`);
    const representation = briefSystem.representation_rotation[index % briefSystem.representation_rotation.length];

    return {
      asset_id: slot.asset_id,
      type_id: slot.type_id,
      core_code: slot.core_code,
      type_name_draft_ja: type.public_name_draft_ja,
      status: 'brief-ready-asset-unproduced',
      public_use: false,
      runtime_generation: false,
      representation_variant: representation,
      representation_basis: 'catalog-index-rotation-only',
      scene_brief_ja: `${type.public_name_draft_ja}の開発用ヒーローイラスト。役割モチーフは${slot.motif_contract.role.join(' / ')}、行動構図は${slot.motif_contract.action.join(' / ')}、関係構図は${slot.motif_contract.relationship.join(' / ')}を使う。職業・能力・価値序列を表すのではなく、Core Codeの構造差を識別するための視覚メタファーとして扱う。`,
      style_contract: { ...briefSystem.shared_style },
      motif_contract: slot.motif_contract,
      crop_contract: { ...briefSystem.crop_contract },
      prohibited_tropes: [...illustrationSystem.prohibited_tropes],
      review_checks: Object.fromEntries(briefSystem.review_checks.map((check) => [check, false])),
      master_path: null,
      variants: { ...slot.variants },
      source_provenance: null
    };
  });

  return {
    brief_system_version: briefSystem.brief_system_version,
    illustration_system_version: illustrationSystem.illustration_system_version,
    editorial_catalog_version: editorialManifest.editorial_catalog_version,
    status: briefSystem.status,
    public_use: false,
    runtime_generation: false,
    representation_note: briefSystem.representation_note,
    entry_count: entries.length,
    entries
  };
}
