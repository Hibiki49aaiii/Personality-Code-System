import fs from 'node:fs';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || !/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
  throw new Error('DATABASE_URL is required');
}

const policy = JSON.parse(
  fs.readFileSync('data/privacy/diagnostic-retention-v0.1-dev.json', 'utf8')
);
if (policy.diagnostic_retention_policy_version !== 'diagnostic-retention-v0.1-dev') {
  throw new Error('Unexpected diagnostic retention policy version');
}

for (const key of [
  'abandoned_session_days',
  'completed_raw_answers_days',
  'completed_private_result_days',
  'completed_session_metadata_days',
  'completed_trait_scores_days'
]) {
  const value = policy[key];
  if (!Number.isSafeInteger(value) || value < 1 || value > 3650) {
    throw new Error(`${key} must be an integer from 1 to 3650`);
  }
}

if (
  policy.completed_private_result_days !== policy.completed_session_metadata_days ||
  policy.completed_private_result_days !== policy.completed_trait_scores_days
) {
  throw new Error('Current cleanup implementation requires session/result/trait-score retention windows to match');
}

const execute = process.argv.includes('--execute');
if (
  execute &&
  process.env.PCS_DIAGNOSTIC_RETENTION_EXECUTION_ACK !== policy.execution_ack_value
) {
  throw new Error(
    `Execution requires PCS_DIAGNOSTIC_RETENTION_EXECUTION_ACK=${policy.execution_ack_value}`
  );
}

const asOf = new Date();
const DAY_MS = 24 * 60 * 60 * 1000;
const abandonedCutoff = new Date(
  asOf.getTime() - policy.abandoned_session_days * DAY_MS
);
const rawAnswerCutoff = new Date(
  asOf.getTime() - policy.completed_raw_answers_days * DAY_MS
);
const completedSessionCutoff = new Date(
  asOf.getTime() - policy.completed_session_metadata_days * DAY_MS
);

const sql = postgres(databaseUrl, {
  max: 1,
  connect_timeout: 10,
  idle_timeout: 5
});

try {
  const [counts] = await sql`
    SELECT
      (
        SELECT count(*)::int
        FROM anonymous_sessions
        WHERE status = 'in_progress'
          AND updated_at < ${abandonedCutoff}
      ) AS abandoned_sessions,
      (
        SELECT count(*)::int
        FROM assessment_answers a
        JOIN anonymous_sessions s ON s.session_id = a.session_id
        WHERE s.status = 'completed'
          AND s.completed_at IS NOT NULL
          AND s.completed_at < ${rawAnswerCutoff}
      ) AS completed_raw_answers,
      (
        SELECT count(*)::int
        FROM anonymous_sessions
        WHERE status = 'completed'
          AND completed_at IS NOT NULL
          AND completed_at < ${completedSessionCutoff}
      ) AS completed_sessions,
      (
        SELECT count(*)::int
        FROM public_share_snapshots p
        JOIN result_snapshots r ON r.snapshot_id = p.source_result_snapshot_id
        JOIN anonymous_sessions s ON s.session_id = r.session_id
        WHERE p.status = 'active'
          AND s.status = 'completed'
          AND s.completed_at IS NOT NULL
          AND s.completed_at < ${completedSessionCutoff}
      ) AS active_public_shares_to_revoke
  `;

  const summary = {
    mode: execute ? 'execute' : 'dry-run',
    policyVersion: policy.diagnostic_retention_policy_version,
    asOf: asOf.toISOString(),
    cutoffs: {
      abandonedSession: abandonedCutoff.toISOString(),
      completedRawAnswers: rawAnswerCutoff.toISOString(),
      completedSessionAndPrivateResult: completedSessionCutoff.toISOString()
    },
    expired: counts
  };
  console.log(JSON.stringify(summary, null, 2));

  if (!execute) {
    console.log(
      'Dry-run only. Re-run with --execute and the explicit execution acknowledgement to delete expired diagnostic data.'
    );
  } else {
    const deleted = await sql.begin(async (tx) => {
      const abandoned = await tx`
        DELETE FROM anonymous_sessions
        WHERE status = 'in_progress'
          AND updated_at < ${abandonedCutoff}
        RETURNING session_id
      `;

      const completed = await tx`
        DELETE FROM anonymous_sessions
        WHERE status = 'completed'
          AND completed_at IS NOT NULL
          AND completed_at < ${completedSessionCutoff}
        RETURNING session_id
      `;

      const rawAnswers = await tx`
        DELETE FROM assessment_answers a
        USING anonymous_sessions s
        WHERE a.session_id = s.session_id
          AND s.status = 'completed'
          AND s.completed_at IS NOT NULL
          AND s.completed_at < ${rawAnswerCutoff}
        RETURNING a.session_id, a.item_id
      `;

      return {
        abandonedSessions: abandoned.length,
        completedSessions: completed.length,
        completedRawAnswers: rawAnswers.length
      };
    });
    console.log(JSON.stringify({ deleted }, null, 2));
  }
} finally {
  await sql.end({ timeout: 5 });
}
