import type { ContentModule } from './contentComposer';

export interface TypeCatalogScaffoldEntry {
  type_id: string;
  core_code: string;
  status: string;
  formal_draft_title_ja: string;
  title_parts: {
    relation_mode: string;
    action_exploration_mode: string;
    cognitive_governance_archetype: string;
  };
  title_provenance: string[];
  neighbor_codes: string[];
}

export interface TypeCatalogScaffold {
  catalog_version: string;
  naming_system_version: string;
  code_schema_version: string;
  schema_token: string;
  locale: string;
  status: string;
  public_use: boolean;
  entry_count: number;
  entries: TypeCatalogScaffoldEntry[];
}

interface EditorialPrimitive {
  key: string;
  label_ja: string;
  provenance: string[];
  identity_ja: string;
  strength_ja: string;
  failure_mode_ja: string;
}

export interface TypeEditorialPrimitivesJa {
  primitive_version: string;
  catalog_version: string;
  code_schema_version: string;
  locale: string;
  status: string;
  public_use: boolean;
  cognitive_governance_archetypes: EditorialPrimitive[];
  action_exploration_modes: EditorialPrimitive[];
  relationship_modes: EditorialPrimitive[];
}

export interface DevelopmentContentV02Manifest {
  content_version: string;
  locale: string;
  status: 'development-materialized';
  extends_content_version: string;
  materializer_version: 'content-materializer-v0.2';
  type_catalog_version: string;
  type_primitive_version: string;
  generated_domains: ['core-identity', 'hidden-strengths', 'adversarial'];
}

export class TypeCatalogContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TypeCatalogContentError';
  }
}

function indexPrimitives(items: readonly EditorialPrimitive[], label: string): Map<string, EditorialPrimitive> {
  const result = new Map<string, EditorialPrimitive>();
  for (const item of items) {
    if (!item.key || result.has(item.key)) {
      throw new TypeCatalogContentError(`${label}: duplicate or empty primitive key ${item.key}`);
    }
    result.set(item.key, item);
  }
  return result;
}

function requirePrimitive(map: ReadonlyMap<string, EditorialPrimitive>, key: string, label: string): EditorialPrimitive {
  const item = map.get(key);
  if (!item) throw new TypeCatalogContentError(`${label}: missing primitive ${key}`);
  return item;
}

function generatedModule(input: {
  id: string;
  domain: 'core-identity' | 'hidden-strengths' | 'adversarial';
  coreCode: string;
  contentVersion: string;
  locale: string;
  assertionTags: string[];
  text: string;
}): ContentModule {
  return {
    id: input.id,
    locale: input.locale,
    domain: input.domain,
    priority: 300,
    activation: { kind: 'core_code', codes: [input.coreCode] },
    assertion_tags: input.assertionTags,
    suppresses_tags: [],
    conflicts_with_tags: [],
    text: input.text,
    content_version: input.contentVersion,
    status: 'development'
  };
}

export function materializeDevelopmentContentV02(input: {
  manifest: DevelopmentContentV02Manifest;
  baseModules: readonly ContentModule[];
  scaffold: TypeCatalogScaffold;
  primitives: TypeEditorialPrimitivesJa;
}): ContentModule[] {
  const { manifest, scaffold, primitives } = input;

  if (manifest.materializer_version !== 'content-materializer-v0.2') {
    throw new TypeCatalogContentError(`unsupported materializer ${manifest.materializer_version}`);
  }
  if (manifest.locale !== scaffold.locale || manifest.locale !== primitives.locale) {
    throw new TypeCatalogContentError('locale mismatch across content manifest/catalog/primitives');
  }
  if (manifest.type_catalog_version !== scaffold.catalog_version || primitives.catalog_version !== scaffold.catalog_version) {
    throw new TypeCatalogContentError('type catalog version mismatch');
  }
  if (manifest.type_primitive_version !== primitives.primitive_version) {
    throw new TypeCatalogContentError('type primitive version mismatch');
  }
  if (scaffold.code_schema_version !== primitives.code_schema_version) {
    throw new TypeCatalogContentError('code schema mismatch between scaffold and primitives');
  }
  if (scaffold.public_use !== false || primitives.public_use !== false) {
    throw new TypeCatalogContentError('development type catalog/primitives must remain non-public');
  }
  if (scaffold.entries.length !== scaffold.entry_count || scaffold.entry_count !== 64) {
    throw new TypeCatalogContentError(`expected 64 scaffold entries, got ${scaffold.entries.length}`);
  }

  const cognitive = indexPrimitives(primitives.cognitive_governance_archetypes, 'cognitive');
  const action = indexPrimitives(primitives.action_exploration_modes, 'action');
  const relation = indexPrimitives(primitives.relationship_modes, 'relationship');

  const rebasedBase = input.baseModules.map((module) => ({
    ...module,
    content_version: manifest.content_version
  }));

  const generated: ContentModule[] = [];
  const seenCodes = new Set<string>();

  for (const entry of scaffold.entries) {
    const code = entry.core_code;
    if (!/^[A-Z]{6}$/.test(code) || seenCodes.has(code)) {
      throw new TypeCatalogContentError(`invalid or duplicate Core Code ${code}`);
    }
    seenCodes.add(code);

    const cognitiveKey = code.slice(0, 3);
    const actionKey = code.slice(3, 5);
    const relationKey = code[5];
    const c = requirePrimitive(cognitive, cognitiveKey, code);
    const a = requirePrimitive(action, actionKey, code);
    const r = requirePrimitive(relation, relationKey, code);

    const sharedTags = [
      `core.type.${code}`,
      `core.cognitive.${cognitiveKey}`,
      `core.action.${actionKey}`,
      `core.relation.${relationKey}`
    ];

    generated.push(
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

  const all = [...rebasedBase, ...generated];
  const ids = new Set<string>();
  for (const module of all) {
    if (ids.has(module.id)) throw new TypeCatalogContentError(`duplicate materialized module id ${module.id}`);
    ids.add(module.id);
    if (module.content_version !== manifest.content_version) {
      throw new TypeCatalogContentError(`${module.id}: wrong materialized content version`);
    }
  }

  return all;
}
