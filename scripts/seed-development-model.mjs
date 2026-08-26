import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import postgres from 'postgres';

const MODEL_VERSION = 'assessment-dev-v0.1';
const DICTIONARY_VERSION = 'trait-dictionary-v0.2';
const ITEM_BANK_VERSION = 'item-bank-v0.2';
const SCORING_VERSION = 'scoring-v0.1-dev';
const CODE_SCHEMA_VERSION = 'core-code-v0.1-dev';
const INTERACTION_VERSION = 'trait-interactions-v0.1';
const CONTENT_VERSION = 'content-dev-v0.1';
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
  for (const file of manifest.files) {
    baseItems.push(...JSON.parse(await readFile(path.join(baseDir, file), 'utf8')));
  }

  const ledger = await readJson('data/item-bank/v0.2/review.json');
  const accepted = new Set(Object.values(ledger.accepted_by_trait).flat());
  const held = new Map(ledger.hold_for_beta.map((entry) => [entry.id, entry]));
  const revisions = new Map(ledger.revisions.map((entry) => [entry.id, entry]));

  const reviewed = baseItems.map((item) => {
    const revision = revisions.get(item.id);
    const dispositions = Number(accepted.has(item.id)) + Number(held.has(item.id)) + Number(Boolean(revision));
    assert.equal(dispositions, 1, `exactly one review disposition required for ${item.id}`);
    return {
      ...item,
      revision: revision?.revision ?? item.revision,
      text: revision?.text ?? item.text,
      status: 'reviewed',
      reviewed_in: ledger.reviewed_in
    };
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
  const content = await readJson('data/content/dev-v0.1.json');
  assertSame('content version', content.content_version, CONTENT_VERSION);
  assertSame('content locale', content.locale, LOCALE);

  const migrationFiles = (await readdir(path.join(process.cwd(), 'drizzle')))
    .filter((file) => /^\d+_.*\.sql$/i.test(file))
    .sort();
  if (process.env.PCS_SEED_APPLY_MIGRATIONS === '1') {
    for (const file of migrationFiles) {
      await sql.file(path.join(process.cwd(), 'drizzle', file));
    }
  }

  await sql.begin(async (tx) => {
    const traitIds = [...new Set(reviewed.map((item) => item.primary_trait))];
    assert.equal(traitIds.length, 21);

    for (const traitId of traitIds) {
      await tx`INSERT INTO trait_definitions (trait_id) VALUES (${traitId}) ON CONFLICT (trait_id) DO NOTHING`;
    }

    for (const item of reviewed) {
      const existingItem = await tx`
        SELECT item_id, primary_trait_id FROM assessment_items WHERE item_id = ${item.id}
      `;
      if (existingItem.length === 0) {
        await tx`
          INSERT INTO assessment_items (item_id, primary_trait_id)
          VALUES (${item.id}, ${item.primary_trait})
        `;
      } else {
        assertSame(`${item.id} primary Trait`, existingItem[0].primary_trait_id, item.primary_trait);
      }

      const existingRevision = await tx`
        SELECT text, rationale, lifecycle_status, introduced_item_bank_version
        FROM assessment_item_revisions
        WHERE item_id = ${item.id} AND revision = ${item.revision} AND locale = ${item.locale}
      `;
      if (existingRevision.length === 0) {
        await tx`
          INSERT INTO assessment_item_revisions
            (item_id, revision, locale, text, rationale, lifecycle_status, introduced_item_bank_version)
          VALUES
            (${item.id}, ${item.revision}, ${item.locale}, ${item.text}, ${item.rationale}, 'reviewed', ${item.introduced})
        `;
      } else {
        const stored = existingRevision[0];
        assertSame(`${item.id}/${item.revision} text`, stored.text, item.text);
        assertSame(`${item.id}/${item.revision} rationale`, stored.rationale, item.rationale);
        assertSame(`${item.id}/${item.revision} lifecycle`, stored.lifecycle_status, 'reviewed');
        assertSame(`${item.id}/${item.revision} introduced version`, stored.introduced_item_bank_version, item.introduced);
      }
    }

    const existingContentVersion = await tx`
      SELECT locale, status FROM content_versions WHERE content_version = ${CONTENT_VERSION}
    `;
    if (existingContentVersion.length === 0) {
      await tx`
        INSERT INTO content_versions (content_version, locale, status)
        VALUES (${CONTENT_VERSION}, ${LOCALE}, 'beta')
      `;
    } else {
      assertSame('content version locale', existingContentVersion[0].locale, LOCALE);
      assert.ok(['beta', 'published'].includes(existingContentVersion[0].status));
    }

    for (const module of content.modules) {
      const existingModule = await tx`
        SELECT domain, priority, module_json
        FROM content_modules
        WHERE content_version = ${CONTENT_VERSION} AND module_id = ${module.id}
      `;
      if (existingModule.length === 0) {
        await tx`
          INSERT INTO content_modules
            (content_version, module_id, domain, priority, module_json)
          VALUES
            (${CONTENT_VERSION}, ${module.id}, ${module.domain}, ${module.priority}, ${tx.json(module)})
        `;
      } else {
        const stored = existingModule[0];
        assertSame(`${module.id} domain`, stored.domain, module.domain);
        assertSame(`${module.id} priority`, stored.priority, module.priority);
        assert.deepEqual(stored.module_json, module, `${module.id} module JSON differs from versioned source`);
      }
    }

    const existingModel = await tx`
      SELECT * FROM assessment_model_releases WHERE model_version = ${MODEL_VERSION}
    `;
    if (existingModel.length === 0) {
      await tx`
        INSERT INTO assessment_model_releases
          (model_version, status, locale, trait_dictionary_version, item_bank_version,
           scoring_version, code_schema_version, interaction_version, content_version)
        VALUES
          (${MODEL_VERSION}, 'beta', ${LOCALE}, ${DICTIONARY_VERSION}, ${ITEM_BANK_VERSION},
           ${SCORING_VERSION}, ${CODE_SCHEMA_VERSION}, ${INTERACTION_VERSION}, ${CONTENT_VERSION})
      `;
    } else {
      const model = existingModel[0];
      assert.ok(['beta', 'published'].includes(model.status), 'existing development model must be beta or published');
      assertSame('model locale', model.locale, LOCALE);
      assertSame('model Trait Dictionary', model.trait_dictionary_version, DICTIONARY_VERSION);
      assertSame('model Item Bank', model.item_bank_version, ITEM_BANK_VERSION);
      assertSame('model scoring', model.scoring_version, SCORING_VERSION);
      assertSame('model code schema', model.code_schema_version, CODE_SCHEMA_VERSION);
      assertSame('model interaction', model.interaction_version, INTERACTION_VERSION);
      assertSame('model content', model.content_version, CONTENT_VERSION);
    }

    const currentMappings = await tx`
      SELECT position, item_id, item_revision, locale, trait_id, direction, weight_milli, required
      FROM assessment_model_items
      WHERE model_version = ${MODEL_VERSION}
      ORDER BY position
    `;

    if (currentMappings.length === 0) {
      for (let index = 0; index < reviewed.length; index += 1) {
        const item = reviewed[index];
        await tx`
          INSERT INTO assessment_model_items
            (model_version, position, item_id, item_revision, locale, trait_id, direction, weight_milli, required)
          VALUES
            (${MODEL_VERSION}, ${index + 1}, ${item.id}, ${item.revision}, ${item.locale},
             ${item.primary_trait}, ${item.direction}, ${Math.round(item.weight * 1000)}, true)
        `;
      }
    } else {
      assert.equal(currentMappings.length, reviewed.length, 'existing model mapping count mismatch');
      currentMappings.forEach((mapping, index) => {
        const item = reviewed[index];
        assertSame(`mapping ${index + 1} item`, mapping.item_id, item.id);
        assertSame(`mapping ${index + 1} revision`, mapping.item_revision, item.revision);
        assertSame(`mapping ${index + 1} locale`, mapping.locale, item.locale);
        assertSame(`mapping ${index + 1} Trait`, mapping.trait_id, item.primary_trait);
        assertSame(`mapping ${index + 1} direction`, mapping.direction, item.direction);
        assertSame(`mapping ${index + 1} weight`, mapping.weight_milli, Math.round(item.weight * 1000));
        assertSame(`mapping ${index + 1} required`, mapping.required, true);
      });
    }

    const [counts] = await tx`
      SELECT
        (SELECT count(*)::int FROM assessment_model_items WHERE model_version = ${MODEL_VERSION}) AS model_items,
        (SELECT count(*)::int FROM content_modules WHERE content_version = ${CONTENT_VERSION}) AS content_modules
    `;
    assert.equal(counts.model_items, 147);
    assert.equal(counts.content_modules, content.modules.length);
  });

  console.log(
    `Development model seed verified: ${MODEL_VERSION}, ${manifest.expected_total_items} reviewed items, ${CONTENT_VERSION}. Existing versioned rows are drift-checked and never overwritten.`
  );
} finally {
  await sql.end({ timeout: 5 });
}
