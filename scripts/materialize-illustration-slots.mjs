export function materializeIllustrationSlots({ reachability, illustrationSystem }) {
  if (reachability.catalog_version !== illustrationSystem.catalog_version) {
    throw new Error('illustration catalog version mismatch');
  }
  if (reachability.code_schema_version !== illustrationSystem.code_schema_version) {
    throw new Error('illustration code schema version mismatch');
  }
  if (reachability.public_use !== false || illustrationSystem.public_use !== false) {
    throw new Error('development illustration artifacts must remain public_use=false');
  }
  if (illustrationSystem.runtime_generation !== false) {
    throw new Error('runtime illustration generation is prohibited');
  }

  const entries = reachability.core_codes.map((coreCode) => {
    const roleKey = coreCode.slice(0, 3);
    const actionKey = coreCode.slice(3, 5);
    const relationshipKey = coreCode.slice(5);
    const role = illustrationSystem.role_motifs[roleKey];
    const action = illustrationSystem.action_compositions[actionKey];
    const relationship = illustrationSystem.relationship_compositions[relationshipKey];
    if (!role || !action || !relationship) throw new Error(`missing illustration component for ${coreCode}`);

    return {
      type_id: `${reachability.schema_token}-${coreCode}`,
      core_code: coreCode,
      asset_id: illustrationSystem.asset_id_pattern.replace('{CORE_CODE}', coreCode),
      component_keys: {
        role: roleKey,
        action: actionKey,
        relationship: relationshipKey
      },
      motif_contract: {
        role: [...role.motifs],
        action: [...action.cues],
        relationship: [...relationship.cues]
      },
      status: 'unproduced',
      master_path: null,
      variants: Object.fromEntries(illustrationSystem.required_variants.map((variant) => [variant, null])),
      public_use: false
    };
  });

  return {
    illustration_system_version: illustrationSystem.illustration_system_version,
    catalog_version: reachability.catalog_version,
    code_schema_version: reachability.code_schema_version,
    status: illustrationSystem.status,
    public_use: false,
    runtime_generation: false,
    entry_count: entries.length,
    entries
  };
}
