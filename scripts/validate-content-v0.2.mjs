import fs from 'node:fs';
import { materializeDevelopmentContentV02 } from './materialize-content-v0.2.mjs';

function load(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

const base = load('data/content/dev-v0.1.json');
const manifest = load('data/content/dev-v0.2.json');
const scaffold = load('data/type-catalog/v0.1-dev/editorial-scaffold.json');
const primitives = load('data/type-catalog/v0.1-dev/editorial-primitives.ja.json');
const materialized = materializeDevelopmentContentV02({ manifest, baseContent: base, scaffold, primitives });
const errors = [];

const expectedGenerated = 64 * 3;
if (materialized.modules.length !== base.modules.length + expectedGenerated) {
  errors.push(`expected ${base.modules.length + expectedGenerated} modules, got ${materialized.modules.length}`);
}

for (let index = 0; index < base.modules.length; index += 1) {
  const source = base.modules[index];
  const rebased = materialized.modules[index];
  const normalized = { ...rebased, content_version: source.content_version };
  if (JSON.stringify(normalized) !== JSON.stringify(source)) {
    errors.push(`base module ${source.id} changed beyond content_version rebasing`);
    break;
  }
}

const generated = materialized.modules.slice(base.modules.length);
const byCode = new Map();
for (const module of generated) {
  if (!/^DEV-TYPE-[A-Z]{6}-(IDENTITY|STRENGTHS|ADVERSARIAL)$/.test(module.id)) {
    errors.push(`unexpected generated module id ${module.id}`);
    continue;
  }
  const code = module.id.slice(9, 15);
  if (module.activation?.kind !== 'core_code' || JSON.stringify(module.activation.codes) !== JSON.stringify([code])) {
    errors.push(`${module.id}: activation must target exactly ${code}`);
  }
  if (!module.assertion_tags.includes(`core.type.${code}`)) {
    errors.push(`${module.id}: missing core.type provenance tag`);
  }
  const list = byCode.get(code) ?? [];
  list.push(module);
  byCode.set(code, list);
}

if (byCode.size !== 64) errors.push(`generated modules cover ${byCode.size} Core Codes, expected 64`);

const expectedDomains = ['adversarial', 'core-identity', 'hidden-strengths'];
for (const entry of scaffold.entries) {
  const modules = byCode.get(entry.core_code) ?? [];
  if (modules.length !== 3) {
    errors.push(`${entry.core_code}: expected 3 generated modules, got ${modules.length}`);
    continue;
  }
  const domains = modules.map((module) => module.domain).sort();
  if (JSON.stringify(domains) !== JSON.stringify(expectedDomains)) {
    errors.push(`${entry.core_code}: generated domains ${domains.join(',')} do not match expected`);
  }
  const identity = modules.find((module) => module.domain === 'core-identity');
  if (!identity?.text.includes(entry.formal_draft_title_ja)) {
    errors.push(`${entry.core_code}: identity text does not include structural title`);
  }
}

const generatedIds = new Set(generated.map((module) => module.id));
if (generatedIds.size !== expectedGenerated) errors.push('generated module IDs are not unique');

if (manifest.status !== 'development-materialized') errors.push('v0.2 manifest must remain development-materialized');
if (scaffold.public_use !== false || primitives.public_use !== false) {
  errors.push('Phase 3A development catalog must remain public_use=false');
}

if (errors.length) {
  console.error('Phase 3A content validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Phase 3A content validation passed: ${materialized.modules.length} modules, 64 Core Codes × 3 provenance-backed type modules, v0.1 preserved by version rebasing only.`);
