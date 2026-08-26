export function materializeTypeDisplayNames({ reachability, namingSystem }) {
  if (reachability.catalog_version !== namingSystem.catalog_version) {
    throw new Error('display-name catalog version mismatch');
  }
  if (reachability.code_schema_version !== namingSystem.code_schema_version) {
    throw new Error('display-name code schema version mismatch');
  }
  if (reachability.locale !== namingSystem.locale) {
    throw new Error('display-name locale mismatch');
  }
  if (reachability.public_use !== false || namingSystem.public_use !== false) {
    throw new Error('development naming artifacts must remain public_use=false');
  }

  const entries = reachability.core_codes.map((coreCode) => {
    if (!/^[A-Z]{6}$/.test(coreCode)) throw new Error(`invalid Core Code ${coreCode}`);

    const cognitiveKey = coreCode.slice(0, 3);
    const actionKey = coreCode.slice(3, 5);
    const relationshipKey = coreCode.slice(5);

    const cognitive = namingSystem.cognitive_roles[cognitiveKey];
    const action = namingSystem.action_modes[actionKey];
    const relationship = namingSystem.relationship_modes[relationshipKey];
    if (!cognitive || !action || !relationship) {
      throw new Error(`missing display-name component for ${coreCode}`);
    }

    const displayNameJa = `${action.label_ja}の${cognitive.label_ja}〈${relationship.label_ja}〉`;
    const identitySentenceJa = `${cognitive.identity_clause_ja}、${action.identity_clause_ja}。${relationship.identity_clause_ja}。`;

    return {
      type_id: `${reachability.schema_token}-${coreCode}`,
      core_code: coreCode,
      display_name_ja: displayNameJa,
      identity_sentence_ja: identitySentenceJa,
      component_keys: {
        cognitive: cognitiveKey,
        action: actionKey,
        relationship: relationshipKey
      },
      provenance: [
        ...cognitive.provenance,
        ...action.provenance,
        ...relationship.provenance
      ],
      status: namingSystem.status,
      public_use: false
    };
  });

  return {
    display_name_system_version: namingSystem.display_name_system_version,
    catalog_version: reachability.catalog_version,
    code_schema_version: reachability.code_schema_version,
    locale: reachability.locale,
    status: namingSystem.status,
    public_use: false,
    entry_count: entries.length,
    entries
  };
}
