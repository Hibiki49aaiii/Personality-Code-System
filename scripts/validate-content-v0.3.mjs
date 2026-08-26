import fs from 'node:fs';
import { materializeDevelopmentContentV03 } from './materialize-content-v0.3.mjs';

const load = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));
const baseContent = load('data/content/dev-v0.1.json');
const v02Manifest = load('data/content/dev-v0.2.json');
const v03Manifest = load('data/content/dev-v0.3.json');
const scaffold = load('data/type-catalog/v0.1-dev/editorial-scaffold.json');
const typePrimitives = load('data/type-catalog/v0.1-dev/editorial-primitives.ja.json');
const traitPrimitives = load('data/content/trait-editorial-primitives.ja-v0.1-dev.json');

const content = materializeDevelopmentContentV03({
  manifest: v03Manifest,
  v02Manifest,
  baseContent,
  scaffold,
  typePrimitives,
  traitPrimitives
});
const errors = [];

const expectedCount = (baseContent.modules.length + 64 * 3) - 4 + 1 + 21 * 3;
if (content.modules.length !== expectedCount) {
  errors.push(`expected ${expectedCount} modules, got ${content.modules.length}`);
}

const ids = new Set(content.modules.map((module) => module.id));
for (const replacedId of v03Manifest.replaced_module_ids) {
  const replacement = content.modules.find((module) => module.id === replacedId);
  if (!replacement) {
    errors.push(`missing regenerated replacement ${replacedId}`);
    continue;
  }
  if (replacement.content_version !== v03Manifest.content_version) {
    errors.push(`${replacedId} was not rebound to ${v03Manifest.content_version}`);
  }
  if (replacement.activation.kind !== 'trait_range') {
    errors.push(`${replacedId} must be regenerated as a Trait-band module, not retained as a placeholder`);
  }
}

for (const trait of traitPrimitives.traits) {
  for (const band of ['LOW', 'MID', 'HIGH']) {
    const id = `DEV-TRAIT-${trait.trait_id}-${band}`;
    if (!ids.has(id)) errors.push(`missing ${id}`);
  }
}

const expectedCompatibility = new Map([
  ['DEV-TRAIT-COG-HIGH', 'emotion.high-cog-distance'],
  ['DEV-TRAIT-RDP-HIGH', 'relationship.depth-dependency'],
  ['DEV-TRAIT-OPT-HIGH', 'optimization.cannot-stop'],
  ['DEV-TRAIT-UNC-HIGH', 'uncertainty.adventurousness']
]);
for (const [id, tag] of expectedCompatibility) {
  const module = content.modules.find((entry) => entry.id === id);
  if (!module?.assertion_tags.includes(tag)) errors.push(`${id} must retain interaction-compatible tag ${tag}`);
}

const bands = traitPrimitives.bands;
if (bands.low.max_bp + 1 !== bands.mid.min_bp || bands.mid.max_bp + 1 !== bands.high.min_bp) {
  errors.push('Trait bands must be contiguous with no gap/overlap');
}
if (bands.low.max_bp !== 3399 || bands.mid.min_bp !== 3400 || bands.mid.max_bp !== 6599 || bands.high.min_bp !== 6600) {
  errors.push('Unexpected Trait band thresholds');
}

const midpointDomains = new Set();
const midpointCore = 'SVAEND';
for (const module of content.modules) {
  if (module.activation.kind === 'fallback') continue;
  let active = false;
  if (module.activation.kind === 'always') active = true;
  else if (module.activation.kind === 'core_code') active = module.activation.codes.includes(midpointCore);
  else if (module.activation.kind === 'trait_range') {
    const score = 5000;
    active = (module.activation.min_bp === undefined || score >= module.activation.min_bp) &&
      (module.activation.max_bp === undefined || score <= module.activation.max_bp);
  }
  // Interaction modules intentionally do not fire for the all-midpoint Golden fixture.
  if (active) midpointDomains.add(module.domain);
}

const requiredDomains = [
  'core-identity','trait-overview','thinking','emotion','action','relationships-love','work','stress',
  'communication','decision-making','learning','leadership-derived','risk','creativity','hidden-strengths',
  'adversarial','growth','personal-manual'
];
for (const domain of requiredDomains) {
  if (!midpointDomains.has(domain)) errors.push(`midpoint result still requires fallback-only content for ${domain}`);
}

if (traitPrimitives.traits.length !== 21 || new Set(traitPrimitives.traits.map((trait) => trait.trait_id)).size !== 21) {
  errors.push('Trait editorial primitives must contain exactly 21 unique Traits');
}
if (traitPrimitives.public_use !== false || v03Manifest.status !== 'development-materialized') {
  errors.push('v0.3 detailed content must remain non-public development material');
}

if (errors.length) {
  console.error('Detailed content v0.3 validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Detailed content v0.3 validation passed: ${content.modules.length} modules, 21 Traits × 3 bands, all 18 midpoint domains have non-fallback deterministic content.`);
