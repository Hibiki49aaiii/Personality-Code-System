function indexByKey(items, label) {
  const map = new Map();
  for (const item of items) {
    if (!item?.key || map.has(item.key)) throw new Error(`${label}: duplicate or empty key ${item?.key}`);
    map.set(item.key, item);
  }
  return map;
}

function requireItem(map, key, label) {
  const item = map.get(key);
  if (!item) throw new Error(`${label}: missing ${key}`);
  return item;
}

function generatedModule({ id, domain, coreCode, contentVersion, locale, assertionTags, text }) {
  return {
    id,
    locale,
    domain,
    priority: 300,
    activation: { kind: 'core_code', codes: [coreCode] },
    assertion_tags: assertionTags,
    suppresses_tags: [],
    conflicts_with_tags: [],
    text,
    content_version: contentVersion,
    status: 'development'
  };
}

export function materializeDevelopmentContentV02({ manifest, baseContent, scaffold, primitives }) {
  if (manifest.materializer_version !== 'content-materializer-v0.2') {
    throw new Error(`unsupported materializer ${manifest.materializer_version}`);
  }
  if (baseContent.content_version !== manifest.extends_content_version) {
    throw new Error('base content version mismatch');
  }
  if (manifest.locale !== baseContent.locale || manifest.locale !== scaffold.locale || manifest.locale !== primitives.locale) {
    throw new Error('locale mismatch across content inputs');
  }
  if (manifest.type_catalog_version !== scaffold.catalog_version || primitives.catalog_version !== scaffold.catalog_version) {
    throw new Error('type catalog version mismatch');
  }
  if (manifest.type_primitive_version !== primitives.primitive_version) {
    throw new Error('type primitive version mismatch');
  }
  if (scaffold.code_schema_version !== primitives.code_schema_version) {
    throw new Error('code schema mismatch');
  }
  if (scaffold.public_use !== false || primitives.public_use !== false) {
    throw new Error('development type catalog/primitives must remain public_use=false');
  }
  if (!Array.isArray(scaffold.entries) || scaffold.entries.length !== 64 || scaffold.entry_count !== 64) {
    throw new Error(`expected 64 scaffold entries, got ${scaffold.entries?.length}`);
  }

  const cognitive = indexByKey(primitives.cognitive_governance_archetypes, 'cognitive');
  const action = indexByKey(primitives.action_exploration_modes, 'action');
  const relation = indexByKey(primitives.relationship_modes, 'relationship');

  const modules = baseContent.modules.map((module) => ({ ...module, content_version: manifest.content_version }));
  const seenCodes = new Set();

  for (const entry of scaffold.entries) {
    const code = entry.core_code;
    if (!/^[A-Z]{6}$/.test(code) || seenCodes.has(code)) throw new Error(`invalid or duplicate Core Code ${code}`);
    seenCodes.add(code);

    const cognitiveKey = code.slice(0, 3);
    const actionKey = code.slice(3, 5);
    const relationKey = code[5];
    const c = requireItem(cognitive, cognitiveKey, code);
    const a = requireItem(action, actionKey, code);
    const r = requireItem(relation, relationKey, code);
    const sharedTags = [
      `core.type.${code}`,
      `core.cognitive.${cognitiveKey}`,
      `core.action.${actionKey}`,
      `core.relation.${relationKey}`
    ];

    modules.push(
      generatedModule({
        id: `DEV-TYPE-${code}-IDENTITY`,
        domain: 'core-identity',
        coreCode: code,
        contentVersion: manifest.content_version,
        locale: manifest.locale,
        assertionTags: [...sharedTags, `core.type.${code}.identity`],
        text: `[DEV] ${entry.formal_draft_title_ja}。${c.identity_ja} ${a.identity_ja} ${r.identity_ja}`
      }),
      generatedModule({
        id: `DEV-TYPE-${code}-STRENGTHS`,
        domain: 'hidden-strengths',
        coreCode: code,
        contentVersion: manifest.content_version,
        locale: manifest.locale,
        assertionTags: [...sharedTags, `core.type.${code}.strengths`],
        text: `[DEV] ${c.strength_ja} ${a.strength_ja} ${r.strength_ja}`
      }),
      generatedModule({
        id: `DEV-TYPE-${code}-ADVERSARIAL`,
        domain: 'adversarial',
        coreCode: code,
        contentVersion: manifest.content_version,
        locale: manifest.locale,
        assertionTags: [...sharedTags, `core.type.${code}.adversarial`],
        text: `[DEV] ${c.failure_mode_ja} ${a.failure_mode_ja} ${r.failure_mode_ja}`
      })
    );
  }

  const ids = new Set();
  for (const module of modules) {
    if (ids.has(module.id)) throw new Error(`duplicate module id ${module.id}`);
    ids.add(module.id);
    if (module.content_version !== manifest.content_version) throw new Error(`${module.id}: content version drift`);
  }

  return {
    content_version: manifest.content_version,
    locale: manifest.locale,
    status: manifest.status,
    materializer_version: manifest.materializer_version,
    source_versions: {
      base_content_version: manifest.extends_content_version,
      type_catalog_version: manifest.type_catalog_version,
      type_primitive_version: manifest.type_primitive_version
    },
    modules
  };
}
