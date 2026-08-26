import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import postgres from 'postgres';

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

try {
  await sql.unsafe('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');

  runSeed(true);

  const content = JSON.parse(
    await readFile(path.join(process.cwd(), 'data', 'content', 'dev-v0.1.json'), 'utf8')
  );

  const [first] = await sql`
    SELECT
      (SELECT count(*)::int FROM assessment_model_items WHERE model_version = 'assessment-dev-v0.1') AS model_items,
      (SELECT count(DISTINCT trait_id)::int FROM assessment_model_items WHERE model_version = 'assessment-dev-v0.1') AS traits,
      (SELECT count(*)::int FROM assessment_model_items WHERE model_version = 'assessment-dev-v0.1' AND item_revision = 'r2') AS r2_items,
      (SELECT count(*)::int FROM assessment_model_items WHERE model_version = 'assessment-dev-v0.1' AND item_revision = 'r1') AS r1_items,
      (SELECT count(*)::int FROM content_modules WHERE content_version = 'content-dev-v0.1') AS content_modules
  `;

  assert.equal(first.model_items, 147);
  assert.equal(first.traits, 21);
  assert.equal(first.r2_items, 39);
  assert.equal(first.r1_items, 108);
  assert.equal(first.content_modules, content.modules.length);

  const [knownRevision] = await sql`
    SELECT r.revision, r.text
    FROM assessment_model_items m
    JOIN assessment_item_revisions r
      ON r.item_id = m.item_id
     AND r.revision = m.item_revision
     AND r.locale = m.locale
    WHERE m.model_version = 'assessment-dev-v0.1'
      AND m.item_id = 'PCS-SYS-004'
  `;
  assert.equal(knownRevision.revision, 'r2');
  assert.equal(
    knownRevision.text,
    '複数の工程や要素が関わる問題では、前後の依存関係を整理してから考えることが多い。'
  );

  const [model] = await sql`
    SELECT status, locale, trait_dictionary_version, item_bank_version, scoring_version,
           code_schema_version, interaction_version, content_version
    FROM assessment_model_releases
    WHERE model_version = 'assessment-dev-v0.1'
  `;
  assert.deepEqual(
    {
      status: model.status,
      locale: model.locale,
      traitDictionary: model.trait_dictionary_version,
      itemBank: model.item_bank_version,
      scoring: model.scoring_version,
      codeSchema: model.code_schema_version,
      interaction: model.interaction_version,
      content: model.content_version
    },
    {
      status: 'beta',
      locale: 'ja-JP',
      traitDictionary: 'trait-dictionary-v0.2',
      itemBank: 'item-bank-v0.2',
      scoring: 'scoring-v0.1-dev',
      codeSchema: 'core-code-v0.1-dev',
      interaction: 'trait-interactions-v0.1',
      content: 'content-dev-v0.1'
    }
  );

  const before = await sql`
    SELECT
      (SELECT count(*)::int FROM assessment_items) AS items,
      (SELECT count(*)::int FROM assessment_item_revisions) AS revisions,
      (SELECT count(*)::int FROM assessment_model_items) AS mappings,
      (SELECT count(*)::int FROM content_modules) AS modules
  `;

  runSeed(false);

  const after = await sql`
    SELECT
      (SELECT count(*)::int FROM assessment_items) AS items,
      (SELECT count(*)::int FROM assessment_item_revisions) AS revisions,
      (SELECT count(*)::int FROM assessment_model_items) AS mappings,
      (SELECT count(*)::int FROM content_modules) AS modules
  `;
  assert.deepEqual(after[0], before[0], 'second seed must not duplicate or overwrite versioned rows');

  console.log('Development model seed integration passed: 147 reviewed items / 21 Traits, 39 r2 + 108 r1, exact version metadata, and idempotent drift-checked reseed.');
} finally {
  await sql.end({ timeout: 5 });
}
