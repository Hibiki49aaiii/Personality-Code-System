import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;
assert.ok(databaseUrl, 'DATABASE_URL is required for PostgreSQL integration tests');

const sql = postgres(databaseUrl, {
  max: 1,
  connect_timeout: 10,
  idle_timeout: 2
});

async function expectDbFailure(label, fn, pattern) {
  try {
    await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    assert.match(message, pattern, `${label}: unexpected database error: ${message}`);
    return;
  }
  assert.fail(`${label}: expected database operation to fail`);
}

async function applyMigrations() {
  const dir = path.join(process.cwd(), 'drizzle');
  const files = (await readdir(dir))
    .filter((file) => /^\d+_.*\.sql$/i.test(file))
    .sort();

  assert.deepEqual(files, [
    '0000_phase2b_persistence.sql',
    '0001_phase2b_immutability_hardening.sql',
    '0002_phase4a_public_share_snapshots.sql',
    '0003_phase4b_first_party_analytics.sql',
    '0004_security_rate_limits.sql',
    '0005_result_snapshot_asset_linkage.sql',
    '0006_privacy_delete_cascade_guards.sql',
    '0007_diagnostic_retention_answer_guard.sql',
    '0008_calibration_consent_receipts.sql',
    '0009_calibration_operator_plane.sql'
  ]);

  for (const file of files) {
    await sql.file(path.join(dir, file));
  }
}

function sharePayload() {
  return {
    shareSchemaVersion: 'share-snapshot-v0.1-dev',
    sourceResultSnapshotSchemaVersion: 'result-snapshot-v0.1-dev',
    versions: {
      assessmentModelVersion: 'assessment-dev-v0.1',
      codeSchemaVersion: 'core-code-v0.1-dev',
      contentVersion: 'content-dev-v0.1'
    },
    locale: 'ja-JP',
    coreCode: 'SVAEND',
    presentation: {
      displayName: null,
      identitySentence: null,
      illustrationAssetVersion: null
    }
  };
}

function snapshotPayload() {
  return {
    snapshotSchemaVersion: 'result-snapshot-v0.1-dev',
    versions: {
      resultSchemaVersion: 'structured-result-v0.1-dev',
      assessmentModelVersion: 'assessment-dev-v0.1',
      itemBankVersion: 'item-bank-v0.2',
      scoringVersion: 'scoring-v0.1-dev',
      codeSchemaVersion: 'core-code-v0.1-dev',
      interactionVersion: 'trait-interactions-v0.1',
      contentVersion: 'content-dev-v0.1'
    },
    locale: 'ja-JP',
    traitScores: [{ traitId: 'SYS', scoreBp: 5000 }],
    responseQuality: {
      answerCount: 1,
      valueCounts: { '1': 0, '2': 0, '3': 1, '4': 0, '5': 0 },
      dominantResponseShareBp: 10000,
      extremeResponseShareBp: 0,
      flags: []
    },
    personalityCode: {
      codeSchemaVersion: 'core-code-v0.1-dev',
      schemaToken: 'C01D',
      coreCode: 'SVAEND',
      dimensions: [],
      nearBoundaryCount: 0,
      extendedCode: 'PCSX1~test'
    },
    interactionActiveIds: [],
    content: { selectedIds: ['DEV-LIMIT-001'], suppressed: [] },
    sections: [{ domain: 'core-identity', moduleIds: ['DEV-LIMIT-001'] }]
  };
}

try {
  await applyMigrations();

  await sql`
    INSERT INTO illustration_assets (asset_version, asset_key, storage_ref, metadata_json)
    VALUES (
      'ILL-PCS-FALLBACK-HERO-v01',
      'PCS-FALLBACK-HERO',
      'src/components/illustration/CuratedFallbackArtwork.tsx',
      ${sql.json({ curated: true, runtime_generation: false, type_specific: false })}
    )
  `;

  await sql`INSERT INTO trait_definitions (trait_id) VALUES ('SYS')`;
  await sql`
    INSERT INTO trait_definition_revisions
      (trait_id, dictionary_version, locale, display_name, definition)
    VALUES
      ('SYS', 'trait-dictionary-v0.2', 'ja-JP', 'Systems Thinking', 'test definition')
  `;

  await sql`
    INSERT INTO assessment_items (item_id, primary_trait_id)
    VALUES ('PCS-SYS-001', 'SYS'), ('PCS-SYS-999', 'SYS')
  `;
  await sql`
    INSERT INTO assessment_item_revisions
      (item_id, revision, locale, text, rationale, lifecycle_status, introduced_item_bank_version)
    VALUES
      ('PCS-SYS-001', 'r1', 'ja-JP', 'model item', 'integration fixture', 'reviewed', 'item-bank-v0.2'),
      ('PCS-SYS-999', 'r1', 'ja-JP', 'off-model item', 'integration fixture', 'reviewed', 'item-bank-v0.2')
  `;

  await sql`
    INSERT INTO content_versions (content_version, locale, status)
    VALUES ('content-dev-v0.1', 'ja-JP', 'draft')
  `;
  await sql`
    INSERT INTO content_modules (content_version, module_id, domain, priority, module_json)
    VALUES ('content-dev-v0.1', 'DEV-LIMIT-001', 'core-identity', 500, ${sql.json({ text: 'fixture' })})
  `;
  await sql`
    UPDATE content_versions SET status = 'published'
    WHERE content_version = 'content-dev-v0.1'
  `;

  await sql`
    INSERT INTO assessment_model_releases
      (model_version, status, locale, trait_dictionary_version, item_bank_version,
       scoring_version, code_schema_version, interaction_version, content_version)
    VALUES
      ('assessment-dev-v0.1', 'draft', 'ja-JP', 'trait-dictionary-v0.2', 'item-bank-v0.2',
       'scoring-v0.1-dev', 'core-code-v0.1-dev', 'trait-interactions-v0.1', 'content-dev-v0.1')
  `;
  await sql`
    INSERT INTO assessment_model_items
      (model_version, position, item_id, item_revision, locale, trait_id, direction, weight_milli, required)
    VALUES
      ('assessment-dev-v0.1', 1, 'PCS-SYS-001', 'r1', 'ja-JP', 'SYS', 1, 1000, true)
  `;
  await sql`
    UPDATE assessment_model_releases
    SET status = 'published', published_at = now()
    WHERE model_version = 'assessment-dev-v0.1'
  `;

  await expectDbFailure(
    'published model release update',
    () => sql`UPDATE assessment_model_releases SET locale = 'en-US' WHERE model_version = 'assessment-dev-v0.1'`,
    /published assessment_model_releases are immutable/i
  );
  await expectDbFailure(
    'published model item update',
    () => sql`UPDATE assessment_model_items SET direction = -1 WHERE model_version = 'assessment-dev-v0.1' AND position = 1`,
    /items belonging to a published assessment model are immutable/i
  );
  await expectDbFailure(
    'published model item insertion',
    () => sql`
      INSERT INTO assessment_model_items
        (model_version, position, item_id, item_revision, locale, trait_id, direction, weight_milli, required)
      VALUES
        ('assessment-dev-v0.1', 2, 'PCS-SYS-999', 'r1', 'ja-JP', 'SYS', 1, 1000, true)
    `,
    /items belonging to a published assessment model are immutable/i
  );
  await expectDbFailure(
    'published content module update',
    () => sql`
      UPDATE content_modules SET priority = 999
      WHERE content_version = 'content-dev-v0.1' AND module_id = 'DEV-LIMIT-001'
    `,
    /modules belonging to a published content version are immutable/i
  );
  await expectDbFailure(
    'published content version update',
    () => sql`UPDATE content_versions SET locale = 'en-US' WHERE content_version = 'content-dev-v0.1'`,
    /published content_versions are immutable/i
  );
  await expectDbFailure(
    'item revision mutation',
    () => sql`
      UPDATE assessment_item_revisions SET text = 'mutated'
      WHERE item_id = 'PCS-SYS-001' AND revision = 'r1' AND locale = 'ja-JP'
    `,
    /versioned revision rows are immutable/i
  );
  await expectDbFailure(
    'trait revision mutation',
    () => sql`
      DELETE FROM trait_definition_revisions
      WHERE trait_id = 'SYS' AND dictionary_version = 'trait-dictionary-v0.2' AND locale = 'ja-JP'
    `,
    /versioned revision rows are immutable/i
  );

  const [session] = await sql`
    INSERT INTO anonymous_sessions
      (access_token_hash, model_version, locale, expires_at)
    VALUES
      (${'a'.repeat(64)}, 'assessment-dev-v0.1', 'ja-JP', now() + interval '1 hour')
    RETURNING session_id
  `;
  assert.ok(session?.session_id);
  const sessionId = session.session_id;

  await expectDbFailure(
    'off-model answer',
    () => sql`
      INSERT INTO assessment_answers (session_id, item_id, item_revision, locale, value)
      VALUES (${sessionId}, 'PCS-SYS-999', 'r1', 'ja-JP', 3)
    `,
    /not part of the session assessment model/i
  );
  await expectDbFailure(
    'answer range constraint',
    () => sql`
      INSERT INTO assessment_answers (session_id, item_id, item_revision, locale, value)
      VALUES (${sessionId}, 'PCS-SYS-001', 'r1', 'ja-JP', 6)
    `,
    /assessment_answer_value_chk|violates check constraint/i
  );
  await sql`
    INSERT INTO assessment_answers (session_id, item_id, item_revision, locale, value)
    VALUES (${sessionId}, 'PCS-SYS-001', 'r1', 'ja-JP', 3)
  `;

  await expectDbFailure(
    'trait score version mismatch',
    () => sql`
      INSERT INTO assessment_trait_scores (session_id, trait_id, scoring_version, score_bp)
      VALUES (${sessionId}, 'SYS', 'wrong-scoring-version', 5000)
    `,
    /scoring_version does not match session model/i
  );
  await expectDbFailure(
    'trait score range constraint',
    () => sql`
      INSERT INTO assessment_trait_scores (session_id, trait_id, scoring_version, score_bp)
      VALUES (${sessionId}, 'SYS', 'scoring-v0.1-dev', 10001)
    `,
    /assessment_trait_score_bp_chk|violates check constraint/i
  );
  await sql`
    INSERT INTO assessment_trait_scores (session_id, trait_id, scoring_version, score_bp)
    VALUES (${sessionId}, 'SYS', 'scoring-v0.1-dev', 5000)
  `;

  const payload = snapshotPayload();
  await expectDbFailure(
    'snapshot indexed-version mismatch',
    () => sql`
      INSERT INTO result_snapshots
        (session_id, snapshot_schema_version, assessment_model_version, item_bank_version,
         scoring_version, code_schema_version, interaction_version, content_version, locale, snapshot_json)
      VALUES
        (${sessionId}, 'result-snapshot-v0.1-dev', 'assessment-dev-v0.1', 'item-bank-v0.2',
         'wrong-scoring-version', 'core-code-v0.1-dev', 'trait-interactions-v0.1', 'content-dev-v0.1',
         'ja-JP', ${sql.json(payload)})
    `,
    /version\/locale columns do not match the session model/i
  );

  const [snapshot] = await sql`
    INSERT INTO result_snapshots
      (session_id, snapshot_schema_version, assessment_model_version, item_bank_version,
       scoring_version, code_schema_version, interaction_version, content_version, locale, snapshot_json)
    VALUES
      (${sessionId}, 'result-snapshot-v0.1-dev', 'assessment-dev-v0.1', 'item-bank-v0.2',
       'scoring-v0.1-dev', 'core-code-v0.1-dev', 'trait-interactions-v0.1', 'content-dev-v0.1',
       'ja-JP', ${sql.json(payload)})
    RETURNING snapshot_id
  `;
  assert.ok(snapshot?.snapshot_id);

  await expectDbFailure(
    'result snapshot update',
    () => sql`UPDATE result_snapshots SET locale = 'en-US' WHERE snapshot_id = ${snapshot.snapshot_id}`,
    /result_snapshots are immutable/i
  );

  await sql`
    UPDATE anonymous_sessions
    SET status = 'completed', completed_at = now(), updated_at = now()
    WHERE session_id = ${sessionId}
  `;

  const publicPayload = sharePayload();
  await expectDbFailure(
    'public share rejects diagnostic/private fields',
    () => sql`
      INSERT INTO public_share_snapshots
        (public_token_hash, source_result_snapshot_id, share_schema_version,
         assessment_model_version, code_schema_version, content_version, locale, share_json)
      VALUES
        (${'c'.repeat(64)}, ${snapshot.snapshot_id}, 'share-snapshot-v0.1-dev',
         'assessment-dev-v0.1', 'core-code-v0.1-dev', 'content-dev-v0.1', 'ja-JP',
         ${sql.json({ ...publicPayload, traitScores: [{ traitId: 'SYS', scoreBp: 5000 }] })})
    `,
    /prohibited diagnostic\/private field/i
  );

  const [publicShare] = await sql`
    INSERT INTO public_share_snapshots
      (public_token_hash, source_result_snapshot_id, share_schema_version,
       assessment_model_version, code_schema_version, content_version, locale, share_json)
    VALUES
      (${'d'.repeat(64)}, ${snapshot.snapshot_id}, 'share-snapshot-v0.1-dev',
       'assessment-dev-v0.1', 'core-code-v0.1-dev', 'content-dev-v0.1', 'ja-JP',
       ${sql.json(publicPayload)})
    RETURNING share_snapshot_id
  `;
  assert.ok(publicShare?.share_snapshot_id);

  await expectDbFailure(
    'public share payload immutability',
    () => sql`
      UPDATE public_share_snapshots
      SET share_json = ${sql.json({ ...publicPayload, coreCode: 'OTHER' })}
      WHERE share_snapshot_id = ${publicShare.share_snapshot_id}
    `,
    /payload\/version identity is immutable/i
  );

  await expectDbFailure(
    'answer mutation after completion',
    () => sql`
      UPDATE assessment_answers SET value = 4
      WHERE session_id = ${sessionId} AND item_id = 'PCS-SYS-001'
    `,
    /answers may only change while a session is in_progress/i
  );
  await expectDbFailure(
    'answer deletion after completion',
    () => sql`
      DELETE FROM assessment_answers
      WHERE session_id = ${sessionId} AND item_id = 'PCS-SYS-001'
    `,
    /answers may only change while a session is in_progress/i
  );
  await expectDbFailure(
    'trait score deletion after completion',
    () => sql`
      DELETE FROM assessment_trait_scores
      WHERE session_id = ${sessionId} AND trait_id = 'SYS'
    `,
    /trait scores may only change while a session is in_progress/i
  );
  await expectDbFailure(
    'completed session mutation',
    () => sql`UPDATE anonymous_sessions SET locale = 'en-US' WHERE session_id = ${sessionId}`,
    /completed anonymous sessions are immutable/i
  );

  const [incompleteSession] = await sql`
    INSERT INTO anonymous_sessions
      (access_token_hash, model_version, locale, expires_at)
    VALUES
      (${'b'.repeat(64)}, 'assessment-dev-v0.1', 'ja-JP', now() + interval '1 hour')
    RETURNING session_id
  `;
  await expectDbFailure(
    'session completion without answers/scores/snapshot',
    () => sql`
      UPDATE anonymous_sessions
      SET status = 'completed', completed_at = now()
      WHERE session_id = ${incompleteSession.session_id}
    `,
    /missing required answers/i
  );

  const deleted = await sql`
    DELETE FROM result_snapshots
    WHERE snapshot_id = ${snapshot.snapshot_id}
    RETURNING snapshot_id
  `;
  assert.equal(deleted.length, 1, 'retention/privacy deletion of immutable snapshot must remain possible');

  const [revokedShare] = await sql`
    SELECT status, revoked_at, source_result_snapshot_id
    FROM public_share_snapshots
    WHERE share_snapshot_id = ${publicShare.share_snapshot_id}
  `;
  assert.equal(revokedShare?.status, 'revoked');
  assert.ok(revokedShare?.revoked_at);
  assert.equal(revokedShare?.source_result_snapshot_id, null);

  await expectDbFailure(
    'published model deletion',
    () => sql`DELETE FROM assessment_model_releases WHERE model_version = 'assessment-dev-v0.1'`,
    /published assessment_model_releases are immutable/i
  );

  console.log('PostgreSQL persistence integration passed: migrations, publication immutability, model-bound answers, score constraints, snapshot coherence, sanitized public-share DB guards, auto-revocation, completion freeze, and retention deletion verified.');
} finally {
  await sql.end({ timeout: 5 });
}
