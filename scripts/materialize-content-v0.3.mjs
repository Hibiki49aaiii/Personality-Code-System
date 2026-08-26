import { materializeDevelopmentContentV02 } from './materialize-content-v0.2.mjs';

const DOMAINS = new Set([
  'core-identity','trait-overview','thinking','emotion','action','relationships-love','work','stress',
  'communication','decision-making','learning','leadership-derived','risk','creativity','hidden-strengths',
  'adversarial','growth','personal-manual'
]);

function bandActivation(traitId, band, bands) {
  const config = bands[band];
  if (!config) throw new Error(`missing band definition ${band}`);
  return {
    kind: 'trait_range',
    trait_id: traitId,
    ...(config.min_bp === undefined ? {} : { min_bp: config.min_bp }),
    ...(config.max_bp === undefined ? {} : { max_bp: config.max_bp })
  };
}

export function materializeDevelopmentContentV03({
  manifest,
  v02Manifest,
  baseContent,
  scaffold,
  typePrimitives,
  traitPrimitives
}) {
  if (manifest.materializer_version !== 'content-materializer-v0.3') {
    throw new Error(`unsupported materializer ${manifest.materializer_version}`);
  }
  if (manifest.extends_content_version !== v02Manifest.content_version) {
    throw new Error('v0.3 extends_content_version must equal v0.2 content version');
  }
  if (manifest.locale !== traitPrimitives.locale || manifest.locale !== v02Manifest.locale) {
    throw new Error('v0.3 locale mismatch');
  }
  if (manifest.trait_primitive_version !== traitPrimitives.primitive_version) {
    throw new Error('trait primitive version mismatch');
  }
  if (traitPrimitives.public_use !== false || traitPrimitives.status !== 'draft-editorial') {
    throw new Error('trait primitives must remain non-public draft editorial data');
  }

  const v02 = materializeDevelopmentContentV02({
    manifest: v02Manifest,
    baseContent,
    scaffold,
    primitives: typePrimitives
  });

  const replaced = new Set(manifest.replaced_module_ids);
  const modules = v02.modules
    .filter((module) => !replaced.has(module.id))
    .map((module) => ({ ...module, content_version: manifest.content_version }));

  modules.push({
    id: 'DEV-TRAIT-OVERVIEW-VECTOR',
    locale: manifest.locale,
    domain: 'trait-overview',
    priority: 100,
    activation: { kind: 'always' },
    assertion_tags: ['trait-overview.continuous-vector'],
    suppresses_tags: [],
    conflicts_with_tags: [],
    text: '[DEV] PCSでは各Traitを独立した0〜100の連続値として扱います。Core Codeはその一部を圧縮した識別表現であり、詳細な傾向は21 TraitとInteractionを優先して読みます。',
    content_version: manifest.content_version,
    status: 'development'
  });

  const seenTraits = new Set();
  for (const trait of traitPrimitives.traits) {
    if (!/^[A-Z]{3,4}$/.test(trait.trait_id) || seenTraits.has(trait.trait_id)) {
      throw new Error(`invalid or duplicate Trait primitive ${trait.trait_id}`);
    }
    if (!DOMAINS.has(trait.domain)) throw new Error(`${trait.trait_id}: unknown domain ${trait.domain}`);
    seenTraits.add(trait.trait_id);

    for (const band of ['low', 'mid', 'high']) {
      const text = trait[`${band}_ja`];
      if (typeof text !== 'string' || text.trim().length < 20) {
        throw new Error(`${trait.trait_id}/${band}: missing editorial text`);
      }
      const assertionTag = band === 'high' && trait.high_assertion_tag
        ? trait.high_assertion_tag
        : `trait.${trait.trait_id}.${band}`;
      modules.push({
        id: `DEV-TRAIT-${trait.trait_id}-${band.toUpperCase()}`,
        locale: manifest.locale,
        domain: trait.domain,
        priority: 220,
        activation: bandActivation(trait.trait_id, band, traitPrimitives.bands),
        assertion_tags: [assertionTag, `trait-band.${trait.trait_id}.${band}`],
        suppresses_tags: [],
        conflicts_with_tags: [],
        text: `[DEV] ${trait.label_ja}: ${text}`,
        content_version: manifest.content_version,
        status: 'development'
      });
    }
  }

  if (seenTraits.size !== 21) throw new Error(`expected 21 Trait primitives, got ${seenTraits.size}`);

  const ids = new Set();
  for (const module of modules) {
    if (ids.has(module.id)) throw new Error(`duplicate v0.3 module id ${module.id}`);
    ids.add(module.id);
    if (module.content_version !== manifest.content_version) throw new Error(`${module.id}: v0.3 content version drift`);
  }

  return {
    content_version: manifest.content_version,
    locale: manifest.locale,
    status: manifest.status,
    materializer_version: manifest.materializer_version,
    source_versions: {
      content_v02: v02Manifest.content_version,
      trait_primitives: traitPrimitives.primitive_version
    },
    modules
  };
}
