import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import postgres from 'postgres';
import { materializeDevelopmentContentV02 } from '../../scripts/materialize-content-v0.2.mjs';
import { materializeDevelopmentContentV03 } from '../../scripts/materialize-content-v0.3.mjs';

const databaseUrl = process.env.DATABASE_URL;
assert.ok(databaseUrl, 'DATABASE_URL is required');
const sql = postgres(databaseUrl, { max: 1, connect_timeout: 10, idle_timeout: 5 });

function runSeed(applyMigrations) {
  execFileSync(process.execPath, ['scripts/seed-development-model.mjs'], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: databaseUrl, PCS_SEED_APPLY_MIGRATIONS: applyMigrations ? '1' : '0' },
    stdio: 'inherit'
  });
}
const loadJson = async (relativePath) => JSON.parse(await readFile(path.join(process.cwd(), relativePath), 'utf8'));

try {
  await sql.unsafe('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  runSeed(true);

  const baseContent = await loadJson('data/content/dev-v0.1.json');
  const v02Manifest = await loadJson('data/content/dev-v0.2.json');
  const v03Manifest = await loadJson('data/content/dev-v0.3.json');
  const scaffold = await loadJson('data/type-catalog/v0.1-dev/editorial-scaffold.json');
  const typePrimitives = await loadJson('data/type-catalog/v0.1-dev/editorial-primitives.ja.json');
  const traitPrimitives = await loadJson('data/content/trait-editorial-primitives.ja-v0.1-dev.json');
  const contentV02 = materializeDevelopmentContentV02({ manifest: v02Manifest, baseContent, scaffold, primitives: typePrimitives });
  const contentV03 = materializeDevelopmentContentV03({ manifest: v03Manifest, v02Manifest, baseContent, scaffold, typePrimitives, traitPrimitives });

  const [counts] = await sql`
    SELECT
      (SELECT count(*)::int FROM assessment_model_items WHERE model_version='assessment-dev-v0.1') AS v01_items,
      (SELECT count(*)::int FROM assessment_model_items WHERE model_version='assessment-dev-v0.2') AS v02_items,
      (SELECT count(*)::int FROM assessment_model_items WHERE model_version='assessment-dev-v0.3') AS v03_items,
      (SELECT count(*)::int FROM content_modules WHERE content_version='content-dev-v0.1') AS v01_modules,
      (SELECT count(*)::int FROM content_modules WHERE content_version='content-dev-v0.2') AS v02_modules,
      (SELECT count(*)::int FROM content_modules WHERE content_version='content-dev-v0.3') AS v03_modules,
      (SELECT count(*)::int FROM content_modules WHERE content_version='content-dev-v0.3' AND module_id LIKE 'DEV-TYPE-%') AS v03_type_modules,
      (SELECT count(*)::int FROM content_modules WHERE content_version='content-dev-v0.3' AND module_id ~ '^DEV-TRAIT-[A-Z]+-(LOW|MID|HIGH)$') AS v03_trait_band_modules
  `;
  assert.equal(counts.v01_items, 147);
  assert.equal(counts.v02_items, 147);
  assert.equal(counts.v03_items, 147);
  assert.equal(counts.v01_modules, baseContent.modules.length);
  assert.equal(counts.v02_modules, contentV02.modules.length);
  assert.equal(counts.v03_modules, contentV03.modules.length);
  assert.equal(counts.v03_type_modules, 64 * 3);
  assert.equal(counts.v03_trait_band_modules, 21 * 3);

  const models = await sql`
    SELECT model_version, status, locale, trait_dictionary_version, item_bank_version, scoring_version,
           code_schema_version, interaction_version, content_version
    FROM assessment_model_releases
    WHERE model_version IN ('assessment-dev-v0.1','assessment-dev-v0.2','assessment-dev-v0.3')
    ORDER BY model_version
  `;
  assert.equal(models.length, 3);
  assert.deepEqual(models.map((row) => row.content_version), ['content-dev-v0.1','content-dev-v0.2','content-dev-v0.3']);
  for (const model of models) {
    assert.equal(model.status, 'beta');
    assert.equal(model.locale, 'ja-JP');
    assert.equal(model.trait_dictionary_version, 'trait-dictionary-v0.2');
    assert.equal(model.item_bank_version, 'item-bank-v0.2');
    assert.equal(model.scoring_version, 'scoring-v0.1-dev');
    assert.equal(model.code_schema_version, 'core-code-v0.1-dev');
    assert.equal(model.interaction_version, 'trait-interactions-v0.1');
  }

  const scoringMaps = await Promise.all(models.map(async (model) => sql`
    SELECT position, item_id, item_revision, trait_id, direction, weight_milli, required
    FROM assessment_model_items WHERE model_version=${model.model_version} ORDER BY position
  `));
  assert.deepEqual(scoringMaps[1], scoringMaps[0], 'v0.2 scoring mapping must equal v0.1');
  assert.deepEqual(scoringMaps[2], scoringMaps[0], 'v0.3 scoring mapping must equal v0.1');

  const [svaend] = await sql`
    SELECT module_json FROM content_modules
    WHERE content_version='content-dev-v0.3' AND module_id='DEV-TYPE-SVAEND-IDENTITY'
  `;
  assert.match(svaend.module_json.text, /深度・開拓実行型 自律検証設計者/);

  const [sysMid] = await sql`
    SELECT module_json FROM content_modules
    WHERE content_version='content-dev-v0.3' AND module_id='DEV-TRAIT-SYS-MID'
  `;
  assert.equal(sysMid.module_json.activation.kind, 'trait_range');
  assert.equal(sysMid.module_json.activation.min_bp, 3400);
  assert.equal(sysMid.module_json.activation.max_bp, 6599);

  const before = await sql`
    SELECT
      (SELECT count(*)::int FROM assessment_items) AS items,
      (SELECT count(*)::int FROM assessment_item_revisions) AS revisions,
      (SELECT count(*)::int FROM assessment_model_items) AS mappings,
      (SELECT count(*)::int FROM content_modules) AS modules,
      (SELECT count(*)::int FROM assessment_model_releases) AS releases
  `;
  runSeed(false);
  const after = await sql`
    SELECT
      (SELECT count(*)::int FROM assessment_items) AS items,
      (SELECT count(*)::int FROM assessment_item_revisions) AS revisions,
      (SELECT count(*)::int FROM assessment_model_items) AS mappings,
      (SELECT count(*)::int FROM content_modules) AS modules,
      (SELECT count(*)::int FROM assessment_model_releases) AS releases
  `;
  assert.deepEqual(after[0], before[0], 'reseed must not mutate or duplicate any versioned generation');

  console.log(`Three-generation seed integration passed: v0.1/v0.2 preserved, v0.3=${contentV03.modules.length} modules with 63 Trait-band modules, all three scoring mappings identical.`);
} finally {
  await sql.end({ timeout: 5 });
}
