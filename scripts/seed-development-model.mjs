import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import postgres from 'postgres';
import { materializeDevelopmentContentV02 } from './materialize-content-v0.2.mjs';
import { materializeDevelopmentContentV03 } from './materialize-content-v0.3.mjs';

const DICTIONARY_VERSION = 'trait-dictionary-v0.2';
const ITEM_BANK_VERSION = 'item-bank-v0.2';
const SCORING_VERSION = 'scoring-v0.1-dev';
const CODE_SCHEMA_VERSION = 'core-code-v0.1-dev';
const INTERACTION_VERSION = 'trait-interactions-v0.1';
const LOCALE = 'ja-JP';

const databaseUrl = process.env.DATABASE_URL;
assert.ok(databaseUrl, 'DATABASE_URL is required');

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(process.cwd(), relativePath), 'utf8'));
}

async function loadReviewedItems() {
  const manifest = await readJson('data/item-bank/v0.1/manifest.json');
  const baseDir = path.join(process.cwd(), 'data', 'item-bank', 'v0.1');
  const baseItems = [];
  for (const file of manifest.files) baseItems.push(...JSON.parse(await readFile(path.join(baseDir, file), 'utf8')));

  const ledger = await readJson('data/item-bank/v0.2/review.json');
  const accepted = new Set(Object.values(ledger.accepted_by_trait).flat());
  const held = new Map(ledger.hold_for_beta.map((entry) => [entry.id, entry]));
  const revisions = new Map(ledger.revisions.map((entry) => [entry.id, entry]));

  const reviewed = baseItems.map((item) => {
    const revision = revisions.get(item.id);
    const dispositions = Number(accepted.has(item.id)) + Number(held.has(item.id)) + Number(Boolean(revision));
    assert.equal(dispositions, 1, `exactly one review disposition required for ${item.id}`);
    return { ...item, revision: revision?.revision ?? item.revision, text: revision?.text ?? item.text, status: 'reviewed', reviewed_in: ledger.reviewed_in };
  });
  assert.equal(reviewed.length, 147);
  return { manifest, reviewed };
}

function assertSame(label, actual, expected) {
  assert.equal(actual, expected, `${label} differs from the versioned seed contract`);
}

const sql = postgres(databaseUrl, { max: 1, connect_timeout: 10, idle_timeout: 5 });

try {
  const { manifest, reviewed } = await loadReviewedItems();
  const baseContent = await readJson('data/content/dev-v0.1.json');
  const v02Manifest = await readJson('data/content/dev-v0.2.json');
  const v03Manifest = await readJson('data/content/dev-v0.3.json');
  const scaffold = await readJson('data/type-catalog/v0.1-dev/editorial-scaffold.json');
  const typePrimitives = await readJson('data/type-catalog/v0.1-dev/editorial-primitives.ja.json');
  const traitPrimitives = await readJson('data/content/trait-editorial-primitives.ja-v0.1-dev.json');
  const fallbackIllustration = await readJson('data/illustration/v0.1-dev/fallback-asset.json');

  const contentV02 = materializeDevelopmentContentV02({ manifest: v02Manifest, baseContent, scaffold, primitives: typePrimitives });
  const contentV03 = materializeDevelopmentContentV03({
    manifest: v03Manifest,
    v02Manifest,
    baseContent,
    scaffold,
    typePrimitives,
    traitPrimitives
  });
  assert.equal(contentV02.modules.length, baseContent.modules.length + 64 * 3);
  assert.equal(contentV03.modules.length, contentV02.modules.length - 4 + 1 + 21 * 3);

  const releases = [
    { modelVersion: 'assessment-dev-v0.1', content: baseContent },
    { modelVersion: 'assessment-dev-v0.2', content: contentV02 },
    { modelVersion: 'assessment-dev-v0.3', content: contentV03 }
  ];

  const migrationFiles = (await readdir(path.join(process.cwd(), 'drizzle'))).filter((file) => /^\d+_.*\.sql$/i.test(file)).sort();
  if (process.env.PCS_SEED_APPLY_MIGRATIONS === '1') {
    for (const file of migrationFiles) await sql.file(path.join(process.cwd(), 'drizzle', file));
  }

  await sql.begin(async (tx) => {
    const traitIds = [...new Set(reviewed.map((item) => item.primary_trait))];
    assert.equal(traitIds.length, 21);
    for (const traitId of traitIds) await tx`INSERT INTO trait_definitions (trait_id) VALUES (${traitId}) ON CONFLICT (trait_id) DO NOTHING`;

    const storedFallback = await tx`
      SELECT asset_key, storage_ref, metadata_json
      FROM illustration_assets
      WHERE asset_version = ${fallbackIllustration.asset_version}
    `;
    if (storedFallback.length === 0) {
      await tx`
        INSERT INTO illustration_assets (asset_version, asset_key, storage_ref, metadata_json)
        VALUES (
          ${fallbackIllustration.asset_version},
          ${fallbackIllustration.asset_key},
          ${fallbackIllustration.source_ref},
          ${tx.json(fallbackIllustration)}
        )
      `;
    } else {
      assertSame('fallback illustration asset key', storedFallback[0].asset_key, fallbackIllustration.asset_key);
      assertSame('fallback illustration storage ref', storedFallback[0].storage_ref, fallbackIllustration.source_ref);
      assert.deepEqual(storedFallback[0].metadata_json, fallbackIllustration, 'fallback illustration metadata drift');
    }

    for (const item of reviewed) {
      const existingItem = await tx`SELECT item_id, primary_trait_id FROM assessment_items WHERE item_id = ${item.id}`;
      if (existingItem.length === 0) await tx`INSERT INTO assessment_items (item_id, primary_trait_id) VALUES (${item.id}, ${item.primary_trait})`;
      else assertSame(`${item.id} primary Trait`, existingItem[0].primary_trait_id, item.primary_trait);

      const existingRevision = await tx`
        SELECT text, rationale, lifecycle_status, introduced_item_bank_version
        FROM assessment_item_revisions
        WHERE item_id = ${item.id} AND revision = ${item.revision} AND locale = ${item.locale}
      `;
      if (existingRevision.length === 0) {
        await tx`
          INSERT INTO assessment_item_revisions
            (item_id, revision, locale, text, rationale, lifecycle_status, introduced_item_bank_version)
          VALUES (${item.id}, ${item.revision}, ${item.locale}, ${item.text}, ${item.rationale}, 'reviewed', ${item.introduced})
        `;
      } else {
        const stored = existingRevision[0];
        assertSame(`${item.id}/${item.revision} text`, stored.text, item.text);
        assertSame(`${item.id}/${item.revision} rationale`, stored.rationale, item.rationale);
        assertSame(`${item.id}/${item.revision} lifecycle`, stored.lifecycle_status, 'reviewed');
        assertSame(`${item.id}/${item.revision} introduced`, stored.introduced_item_bank_version, item.introduced);
      }
    }

    for (const release of releases) {
      const content = release.content;
      const existingContentVersion = await tx`SELECT locale, status FROM content_versions WHERE content_version = ${content.content_version}`;
      if (existingContentVersion.length === 0) {
        await tx`INSERT INTO content_versions (content_version, locale, status) VALUES (${content.content_version}, ${LOCALE}, 'beta')`;
      } else {
        assertSame(`${content.content_version} locale`, existingContentVersion[0].locale, LOCALE);
        assert.ok(['beta', 'published'].includes(existingContentVersion[0].status));
      }

      for (const module of content.modules) {
        const existingModule = await tx`
          SELECT domain, priority, module_json FROM content_modules
          WHERE content_version = ${content.content_version} AND module_id = ${module.id}
        `;
        if (existingModule.length === 0) {
          await tx`
            INSERT INTO content_modules (content_version, module_id, domain, priority, module_json)
            VALUES (${content.content_version}, ${module.id}, ${module.domain}, ${module.priority}, ${tx.json(module)})
          `;
        } else {
          const stored = existingModule[0];
          assertSame(`${content.content_version}/${module.id} domain`, stored.domain, module.domain);
          assertSame(`${content.content_version}/${module.id} priority`, stored.priority, module.priority);
          assert.deepEqual(stored.module_json, module, `${content.content_version}/${module.id} JSON drift`);
        }
      }

      const existingModel = await tx`SELECT * FROM assessment_model_releases WHERE model_version = ${release.modelVersion}`;
      if (existingModel.length === 0) {
        await tx`
          INSERT INTO assessment_model_releases
            (model_version, status, locale, trait_dictionary_version, item_bank_version, scoring_version, code_schema_version, interaction_version, content_version)
          VALUES
            (${release.modelVersion}, 'beta', ${LOCALE}, ${DICTIONARY_VERSION}, ${ITEM_BANK_VERSION}, ${SCORING_VERSION}, ${CODE_SCHEMA_VERSION}, ${INTERACTION_VERSION}, ${content.content_version})
        `;
      } else {
        const model = existingModel[0];
        assert.ok(['beta', 'published'].includes(model.status));
        assertSame(`${release.modelVersion} locale`, model.locale, LOCALE);
        assertSame(`${release.modelVersion} dictionary`, model.trait_dictionary_version, DICTIONARY_VERSION);
        assertSame(`${release.modelVersion} item bank`, model.item_bank_version, ITEM_BANK_VERSION);
        assertSame(`${release.modelVersion} scoring`, model.scoring_version, SCORING_VERSION);
        assertSame(`${release.modelVersion} code`, model.code_schema_version, CODE_SCHEMA_VERSION);
        assertSame(`${release.modelVersion} interactions`, model.interaction_version, INTERACTION_VERSION);
        assertSame(`${release.modelVersion} content`, model.content_version, content.content_version);
      }

      const mappings = await tx`
        SELECT position, item_id, item_revision, locale, trait_id, direction, weight_milli, required
        FROM assessment_model_items WHERE model_version = ${release.modelVersion} ORDER BY position
      `;
      if (mappings.length === 0) {
        for (let index = 0; index < reviewed.length; index += 1) {
          const item = reviewed[index];
          await tx`
            INSERT INTO assessment_model_items
              (model_version, position, item_id, item_revision, locale, trait_id, direction, weight_milli, required)
            VALUES
              (${release.modelVersion}, ${index + 1}, ${item.id}, ${item.revision}, ${item.locale}, ${item.primary_trait}, ${item.direction}, ${Math.round(item.weight * 1000)}, true)
          `;
        }
      } else {
        assert.equal(mappings.length, reviewed.length, `${release.modelVersion} mapping count`);
        mappings.forEach((mapping, index) => {
          const item = reviewed[index];
          assertSame(`${release.modelVersion}/${index + 1} item`, mapping.item_id, item.id);
          assertSame(`${release.modelVersion}/${index + 1} revision`, mapping.item_revision, item.revision);
          assertSame(`${release.modelVersion}/${index + 1} locale`, mapping.locale, item.locale);
          assertSame(`${release.modelVersion}/${index + 1} Trait`, mapping.trait_id, item.primary_trait);
          assertSame(`${release.modelVersion}/${index + 1} direction`, mapping.direction, item.direction);
          assertSame(`${release.modelVersion}/${index + 1} weight`, mapping.weight_milli, Math.round(item.weight * 1000));
          assertSame(`${release.modelVersion}/${index + 1} required`, mapping.required, true);
        });
      }
    }

    const counts = await tx`
      SELECT model_version, count(*)::int AS item_count
      FROM assessment_model_items
      WHERE model_version IN ('assessment-dev-v0.1','assessment-dev-v0.2','assessment-dev-v0.3')
      GROUP BY model_version ORDER BY model_version
    `;
    assert.equal(counts.length, 3);
    assert.ok(counts.every((row) => row.item_count === 147));
  });

  console.log(`Development seed verified: v0.1 retained, v0.2 type catalog retained, v0.3 detailed Trait content added (${contentV03.modules.length} modules); all three models keep the same 147 scoring items.`);
} finally {
  await sql.end({ timeout: 5 });
}
