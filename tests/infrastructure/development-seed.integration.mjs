import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import postgres from 'postgres';
import { materializeDevelopmentContentV02 } from '../../scripts/materialize-content-v0.2.mjs';

const databaseUrl = process.env.DATABASE_URL;
assert.ok(databaseUrl, 'DATABASE_URL is required');

const sql = postgres(databaseUrl, { max: 1, connect_timeout: 10, idle_timeout: 5 });

function runSeed(applyMigrations) {
  execFileSync(process.execPath, ['scripts/seed-development-model.mjs'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      PCS_SEED_APPLY_MIGRATIONS: applyMigrations ? '1' : '0'
    },
    stdio: 'inherit'
  });
}

async function loadJson(relativePath) {
  return JSON.parse(await readFile(path.join(process.cwd(), relativePath), 'utf8'));
}

try {
  await sql.unsafe('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  runSeed(true);

  const baseContent = await loadJson('data/content/dev-v0.1.json');
  const v02Manifest = await loadJson('data/content/dev-v0.2.json');
  const scaffold = await loadJson('data/type-catalog/v0.1-dev/editorial-scaffold.json');
  const primitives = await loadJson('data/type-catalog/v0.1-dev/editorial-primitives.ja.json');
  const currentContent = materializeDevelopmentContentV02({
    manifest: v02Manifest,
    baseContent,
    scaffold,
    primitives
  });

  const [first] = await sql`
    SELECT
      (SELECT count(*)::int FROM assessment_model_items WHERE model_version = 'assessment-dev-v0.1') AS v01_items,
      (SELECT count(*)::int FROM assessment_model_items WHERE model_version = 'assessment-dev-v0.2') AS v02_items,
      (SELECT count(DISTINCT trait_id)::int FROM assessment_model_items WHERE model_version = 'assessment-dev-v0.2') AS traits,
      (SELECT count(*)::int FROM assessment_model_items WHERE model_version = 'assessment-dev-v0.2' AND item_revision = 'r2') AS r2_items,
      (SELECT count(*)::int FROM assessment_model_items WHERE model_version = 'assessment-dev-v0.2' AND item_revision = 'r1') AS r1_items,
      (SELECT count(*)::int FROM content_modules WHERE content_version = 'content-dev-v0.1') AS v01_modules,
      (SELECT count(*)::int FROM content_modules WHERE content_version = 'content-dev-v0.2') AS v02_modules,
      (SELECT count(*)::int FROM content_modules WHERE content_version = 'content-dev-v0.2' AND module_id LIKE 'DEV-TYPE-%') AS v02_type_modules
  `;

  assert.equal(first.v01_items, 147);
  assert.equal(first.v02_items, 147);
  assert.equal(first.traits, 21);
  assert.equal(first.r2_items, 39);
  assert.equal(first.r1_items, 108);
  assert.equal(first.v01_modules, baseContent.modules.length);
  assert.equal(first.v02_modules, currentContent.modules.length);
  assert.equal(first.v02_type_modules, 64 * 3);

  const [knownRevision] = await sql`
    SELECT r.revision, r.text
    FROM assessment_model_items m
    JOIN assessment_item_revisions r
      ON r.item_id = m.item_id
     AND r.revision = m.item_revision
     AND r.locale = m.locale
    WHERE m.model_version = 'assessment-dev-v0.2'
      AND m.item_id = 'PCS-SYS-004'
  `;
  assert.equal(knownRevision.revision, 'r2');
  assert.equal(
    knownRevision.text,
    '複数の工程や要素が関わる問題では、前後の依存関係を整理してから考えることが多い。'
  );

  const models = await sql`
    SELECT model_version, status, locale, trait_dictionary_version, item_bank_version, scoring_version,
           code_schema_version, interaction_version, content_version
    FROM assessment_model_releases
    WHERE model_version IN ('assessment-dev-v0.1', 'assessment-dev-v0.2')
    ORDER BY model_version
  `;
  assert.equal(models.length, 2);
  assert.equal(models[0].content_version, 'content-dev-v0.1');
  assert.equal(models[1].content_version, 'content-dev-v0.2');
  for (const model of models) {
    assert.equal(model.status, 'beta');
    assert.equal(model.locale, 'ja-JP');
    assert.equal(model.trait_dictionary_version, 'trait-dictionary-v0.2');
    assert.equal(model.item_bank_version, 'item-bank-v0.2');
    assert.equal(model.scoring_version, 'scoring-v0.1-dev');
    assert.equal(model.code_schema_version, 'core-code-v0.1-dev');
    assert.equal(model.interaction_version, 'trait-interactions-v0.1');
  }

  const [svaendIdentity] = await sql`
    SELECT module_json
    FROM content_modules
    WHERE content_version = 'content-dev-v0.2'
      AND module_id = 'DEV-TYPE-SVAEND-IDENTITY'
  `;
  assert.equal(svaendIdentity.module_json.activation.kind, 'core_code');
  assert.deepEqual(svaendIdentity.module_json.activation.codes, ['SVAEND']);
  assert.match(svaendIdentity.module_json.text, /深度・開拓実行型 自律検証設計者/);

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
  assert.deepEqual(after[0], before[0], 'second seed must not duplicate or overwrite versioned rows');

  console.log('Development seed integration passed: immutable v0.1 retained; v0.2 adds 64×3 Core Type modules with the same 147 reviewed items; reseed remains idempotent.');
} finally {
  await sql.end({ timeout: 5 });
}
