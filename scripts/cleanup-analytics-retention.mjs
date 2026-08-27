import fs from 'node:fs';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || !/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
  throw new Error('DATABASE_URL is required');
}

const policy = JSON.parse(
  fs.readFileSync('data/analytics/retention-policy-v0.1-dev.json', 'utf8')
);
if (policy.retention_policy_version !== 'analytics-retention-v0.1-dev') {
  throw new Error('Unexpected analytics retention policy version');
}

const execute = process.argv.includes('--execute');
const asOf = new Date();
const DAY_MS = 24 * 60 * 60 * 1000;
const unscopedCutoff = new Date(
  asOf.getTime() - policy.unscoped_retention_days * DAY_MS
);
const sessionBoundCutoff = new Date(
  asOf.getTime() - policy.session_bound_retention_days * DAY_MS
);

const sql = postgres(databaseUrl, {
  max: 1,
  connect_timeout: 10,
  idle_timeout: 5
});

try {
  const [counts] = await sql`
    SELECT
      count(*) FILTER (
        WHERE session_id IS NULL AND created_at < ${unscopedCutoff}
      )::int AS unscoped_expired,
      count(*) FILTER (
        WHERE session_id IS NOT NULL AND created_at < ${sessionBoundCutoff}
      )::int AS session_bound_expired
    FROM product_events
  `;

  const summary = {
    mode: execute ? 'execute' : 'dry-run',
    policyVersion: policy.retention_policy_version,
    asOf: asOf.toISOString(),
    unscopedCutoff: unscopedCutoff.toISOString(),
    sessionBoundCutoff: sessionBoundCutoff.toISOString(),
    expired: counts
  };
  console.log(JSON.stringify(summary, null, 2));

  if (!execute) {
    console.log('Dry-run only. Re-run with --execute to delete expired analytics rows.');
  } else {
    const deleted = await sql.begin(async (tx) => {
      const unscoped = await tx`
        DELETE FROM product_events
        WHERE session_id IS NULL
          AND created_at < ${unscopedCutoff}
        RETURNING event_id
      `;
      const sessionBound = await tx`
        DELETE FROM product_events
        WHERE session_id IS NOT NULL
          AND created_at < ${sessionBoundCutoff}
        RETURNING event_id
      `;
      return {
        unscoped: unscoped.length,
        sessionBound: sessionBound.length
      };
    });
    console.log(JSON.stringify({ deleted }, null, 2));
  }
} finally {
  await sql.end({ timeout: 5 });
}
