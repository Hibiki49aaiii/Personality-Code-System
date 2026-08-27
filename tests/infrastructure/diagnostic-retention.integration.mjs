import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;
assert.ok(databaseUrl, 'DATABASE_URL is required for diagnostic retention integration');

const sql = postgres(databaseUrl, {
  max: 1,
  connect_timeout: 10,
  idle_timeout: 3
});

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
      extendedCode: 'PCSX1~retention-fixture'
    },
    interactionActiveIds: [],
    content: { selectedIds: ['DEV-LIMIT-001'], suppressed: [] },
    sections: [{ domain: 'core-identity', moduleIds: ['DEV-LIMIT-001'] }]
  };
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

async function createCompletedFixture({ tokenHash, ageDays, withShare = false }) {
  const [session] = await sql`
    INSERT INTO anonymous_sessions
      (access_token_hash, model_version, locale, expires_at, created_at, updated_at)
    VALUES
      (${tokenHash}, 'assessment-dev-v0.1', 'ja-JP',
       now() + interval '1 day',
       now() - (${ageDays} * interval '1 day'),
       now() - (${ageDays} * interval '1 day'))
    RETURNING session_id
  `;

  await sql`
    INSERT INTO assessment_answers (session_id, item_id, item_revision, locale, value, updated_at)
    VALUES (${session.session_id}, 'PCS-SYS-001', 'r1', 'ja-JP', 3, now() - (${ageDays} * interval '1 day'))
  `;
  await sql`
    INSERT INTO assessment_trait_scores (session_id, trait_id, scoring_version, score_bp, created_at)
    VALUES (${session.session_id}, 'SYS', 'scoring-v0.1-dev', 5000, now() - (${ageDays} * interval '1 day'))
  `;
  const [snapshot] = await sql`
    INSERT INTO result_snapshots
      (session_id, snapshot_schema_version, assessment_model_version, item_bank_version,
       scoring_version, code_schema_version, interaction_version, content_version, locale,
       snapshot_json, created_at)
    VALUES
      (${session.session_id}, 'result-snapshot-v0.1-dev', 'assessment-dev-v0.1', 'item-bank-v0.2',
       'scoring-v0.1-dev', 'core-code-v0.1-dev', 'trait-interactions-v0.1', 'content-dev-v0.1',
       'ja-JP', ${sql.json(snapshotPayload())}, now() - (${ageDays} * interval '1 day'))
    RETURNING snapshot_id
  `;

  await sql`
    UPDATE anonymous_sessions
    SET status = 'completed',
        completed_at = now() - (${ageDays} * interval '1 day'),
        updated_at = now() - (${ageDays} * interval '1 day')
    WHERE session_id = ${session.session_id}
  `;

  let shareSnapshotId = null;
  if (withShare) {
    const [share] = await sql`
      INSERT INTO public_share_snapshots
        (public_token_hash, source_result_snapshot_id, share_schema_version,
         assessment_model_version, code_schema_version, content_version, locale, share_json,
         created_at)
      VALUES
        (${'e'.repeat(64)}, ${snapshot.snapshot_id}, 'share-snapshot-v0.1-dev',
         'assessment-dev-v0.1', 'core-code-v0.1-dev', 'content-dev-v0.1', 'ja-JP',
         ${sql.json(sharePayload())}, now() - (${ageDays} * interval '1 day'))
      RETURNING share_snapshot_id
    `;
    shareSnapshotId = share.share_snapshot_id;
  }

  return {
    sessionId: session.session_id,
    snapshotId: snapshot.snapshot_id,
    shareSnapshotId
  };
}

try {
  const [abandoned] = await sql`
    INSERT INTO anonymous_sessions
      (access_token_hash, model_version, locale, expires_at, created_at, updated_at)
    VALUES
      (${'f'.repeat(64)}, 'assessment-dev-v0.1', 'ja-JP',
       now() - interval '30 days',
       now() - interval '31 days',
       now() - interval '31 days')
    RETURNING session_id
  `;
  await sql`
    INSERT INTO assessment_answers (session_id, item_id, item_revision, locale, value)
    VALUES (${abandoned.session_id}, 'PCS-SYS-001', 'r1', 'ja-JP', 3)
  `;

  const rawAnswerExpired = await createCompletedFixture({
    tokenHash: '1'.repeat(64),
    ageDays: 91
  });
  const privateResultExpired = await createCompletedFixture({
    tokenHash: '2'.repeat(64),
    ageDays: 181,
    withShare: true
  });

  const dryRun = spawnSync(process.execPath, ['scripts/cleanup-diagnostic-retention.mjs'], {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8'
  });
  assert.equal(dryRun.status, 0, dryRun.stderr);
  assert.match(dryRun.stdout, /"mode": "dry-run"/);

  const [beforeDryRun] = await sql`
    SELECT count(*)::int AS count
    FROM anonymous_sessions
    WHERE session_id = ${abandoned.session_id}
  `;
  assert.equal(beforeDryRun.count, 1, 'dry-run must not delete expired sessions');

  const execute = spawnSync(
    process.execPath,
    ['scripts/cleanup-diagnostic-retention.mjs', '--execute'],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PCS_DIAGNOSTIC_RETENTION_EXECUTION_ACK: 'diagnostic-retention-v0.1-dev'
      },
      encoding: 'utf8'
    }
  );
  assert.equal(execute.status, 0, execute.stderr);
  assert.match(execute.stdout, /"mode": "execute"/);

  const [abandonedAfter] = await sql`
    SELECT count(*)::int AS count
    FROM anonymous_sessions
    WHERE session_id = ${abandoned.session_id}
  `;
  assert.equal(abandonedAfter.count, 0, '31-day abandoned session must be removed');

  const [rawSession] = await sql`
    SELECT count(*)::int AS count
    FROM anonymous_sessions
    WHERE session_id = ${rawAnswerExpired.sessionId}
  `;
  const [rawAnswers] = await sql`
    SELECT count(*)::int AS count
    FROM assessment_answers
    WHERE session_id = ${rawAnswerExpired.sessionId}
  `;
  const [rawScores] = await sql`
    SELECT count(*)::int AS count
    FROM assessment_trait_scores
    WHERE session_id = ${rawAnswerExpired.sessionId}
  `;
  const [rawResult] = await sql`
    SELECT count(*)::int AS count
    FROM result_snapshots
    WHERE session_id = ${rawAnswerExpired.sessionId}
  `;
  assert.equal(rawSession.count, 1, '91-day completed session metadata must remain');
  assert.equal(rawAnswers.count, 0, '91-day completed raw answers must be deleted');
  assert.equal(rawScores.count, 1, '91-day Trait Scores must remain until private-result retention');
  assert.equal(rawResult.count, 1, '91-day private result must remain');

  const [expiredSession] = await sql`
    SELECT count(*)::int AS count
    FROM anonymous_sessions
    WHERE session_id = ${privateResultExpired.sessionId}
  `;
  assert.equal(expiredSession.count, 0, '181-day completed session must be removed');

  const [share] = await sql`
    SELECT status, revoked_at, source_result_snapshot_id
    FROM public_share_snapshots
    WHERE share_snapshot_id = ${privateResultExpired.shareSnapshotId}
  `;
  assert.equal(share.status, 'revoked', 'private-result retention must revoke active derived public share');
  assert.ok(share.revoked_at);
  assert.equal(share.source_result_snapshot_id, null, 'retained revoked share must detach from deleted private result');

  console.log('Diagnostic retention integration passed: dry-run is non-destructive; 30/90/180-day session/answer/result windows execute as designed; old active shares are revoked and detached.');
} finally {
  await sql.end({ timeout: 5 });
}
