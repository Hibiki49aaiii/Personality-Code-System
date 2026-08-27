import { materializeTypeDisplayNames } from './materialize-type-display-names.mjs';

function indexByKey(rows, label) {
  const map = new Map();
  for (const row of rows) {
    if (!row?.key || map.has(row.key)) throw new Error(`${label}: duplicate or empty key ${row?.key}`);
    map.set(row.key, row);
  }
  return map;
}

function requireRow(map, key, owner) {
  const row = map.get(key);
  if (!row) throw new Error(`${owner}: missing primitive ${key}`);
  return row;
}

export function materializeTypeEditorialCatalog({
  manifest,
  reachability,
  scaffold,
  namingSystem,
  primitives,
  codeSchema
}) {
  if (manifest.catalog_version !== reachability.catalog_version || manifest.catalog_version !== scaffold.catalog_version) {
    throw new Error('editorial catalog/catalog scaffold version mismatch');
  }
  if (manifest.code_schema_version !== codeSchema.code_schema_version || manifest.code_schema_version !== reachability.code_schema_version) {
    throw new Error('editorial catalog code schema mismatch');
  }
  if (manifest.display_name_system_version !== namingSystem.display_name_system_version) {
    throw new Error('display name system version mismatch');
  }
  if (manifest.type_primitive_version !== primitives.primitive_version) {
    throw new Error('type primitive version mismatch');
  }
  if ([manifest, reachability, scaffold, namingSystem, primitives, codeSchema].some((value) => value.public_use !== false)) {
    throw new Error('development editorial catalog inputs must remain public_use=false');
  }
  if (manifest.locale !== 'ja-JP' || reachability.locale !== manifest.locale || scaffold.locale !== manifest.locale || namingSystem.locale !== manifest.locale || primitives.locale !== manifest.locale) {
    throw new Error('editorial catalog locale mismatch');
  }

  const displayCatalog = materializeTypeDisplayNames({ reachability, namingSystem });
  const displayByCode = new Map(displayCatalog.entries.map((entry) => [entry.core_code, entry]));
  const scaffoldByCode = new Map(scaffold.entries.map((entry) => [entry.core_code, entry]));
  const cognitive = indexByKey(primitives.cognitive_governance_archetypes, 'cognitive');
  const action = indexByKey(primitives.action_exploration_modes, 'action');
  const relation = indexByKey(primitives.relationship_modes, 'relationship');
  const axes = [...codeSchema.axes].sort((a, b) => a.position - b.position);

  const entries = reachability.core_codes.map((code) => {
    const display = displayByCode.get(code);
    const structural = scaffoldByCode.get(code);
    if (!display || !structural) throw new Error(`${code}: missing display/scaffold entry`);

    const cKey = code.slice(0, 3);
    const aKey = code.slice(3, 5);
    const rKey = code[5];
    const c = requireRow(cognitive, cKey, code);
    const a = requireRow(action, aKey, code);
    const r = requireRow(relation, rKey, code);

    const allCoreProvenance = [...display.provenance];
    const neighborDifferentiation = structural.neighbor_codes.map((neighborCode) => {
      const differences = [...code].map((symbol, index) => symbol === neighborCode[index] ? null : index).filter((value) => value !== null);
      if (differences.length !== 1) throw new Error(`${code}/${neighborCode}: expected one changed axis`);
      const index = differences[0];
      const axis = axes[index];
      const sourceHigh = code[index] === axis.high_symbol;
      const neighborHigh = neighborCode[index] === axis.high_symbol;
      return {
        neighbor_code: neighborCode,
        changed_axis_position: axis.position,
        trait_id: axis.trait_id,
        source_symbol: code[index],
        neighbor_symbol: neighborCode[index],
        source_label_ja: sourceHigh ? axis.high_label_ja : axis.low_label_ja,
        neighbor_label_ja: neighborHigh ? axis.high_label_ja : axis.low_label_ja,
        note_ja: `${axis.trait_id}だけが「${sourceHigh ? axis.high_label_ja : axis.low_label_ja}」から「${neighborHigh ? axis.high_label_ja : axis.low_label_ja}」へ変わる隣接タイプ。その他5つのCore anchorは同一として比較する。`
      };
    });

    return {
      type_id: display.type_id,
      core_code: code,
      locale: manifest.locale,
      status: manifest.status,
      public_use: false,
      formal_draft_title_ja: structural.formal_draft_title_ja,
      public_name_draft_ja: display.display_name_ja,
      identity_sentence_ja: display.identity_sentence_ja,
      overview_ja: `${c.identity_ja} ${a.identity_ja} ${r.identity_ja}`,
      strengths_ja: `${c.strength_ja} ${a.strength_ja} ${r.strength_ja}`,
      adversarial_ja: `負荷条件が重なると、${c.failure_mode_ja} ${a.failure_mode_ja} ${r.failure_mode_ja}`,
      relationship_love_ja: `${r.identity_ja} ただし、${manifest.limitation_rules.relationship_noncore}`,
      work_ja: `${c.identity_ja} ${a.strength_ja} ただし、${manifest.limitation_rules.work_noncore}`,
      stress_ja: manifest.limitation_rules.stress_noncore,
      growth_guidance_ja: `${manifest.limitation_rules.growth_not_destiny} 点検候補として、${c.failure_mode_ja} ${a.failure_mode_ja} ${r.failure_mode_ja}`,
      personal_manual_ja: `${c.strength_ja} ${a.strength_ja} ${r.strength_ja} ${manifest.limitation_rules.core_is_compression}`,
      claim_provenance: {
        identity_sentence_ja: allCoreProvenance,
        overview_ja: allCoreProvenance,
        strengths_ja: allCoreProvenance,
        adversarial_ja: allCoreProvenance,
        relationship_love_ja: [`core-axis:6:${rKey}`, 'limitation:relationship_noncore'],
        work_ja: allCoreProvenance.slice(0, 5).concat('limitation:work_noncore'),
        stress_ja: ['limitation:stress_noncore'],
        growth_guidance_ja: allCoreProvenance.concat('limitation:growth_not_destiny'),
        personal_manual_ja: allCoreProvenance.concat('limitation:core_is_compression')
      },
      neighbor_differentiation: neighborDifferentiation,
      illustration: { ...manifest.illustration_default },
      source_versions: {
        catalog_version: manifest.catalog_version,
        code_schema_version: manifest.code_schema_version,
        display_name_system_version: manifest.display_name_system_version,
        type_primitive_version: manifest.type_primitive_version
      }
    };
  });

  return {
    editorial_catalog_version: manifest.editorial_catalog_version,
    catalog_version: manifest.catalog_version,
    code_schema_version: manifest.code_schema_version,
    locale: manifest.locale,
    status: manifest.status,
    public_use: false,
    entry_count: entries.length,
    entries
  };
}
