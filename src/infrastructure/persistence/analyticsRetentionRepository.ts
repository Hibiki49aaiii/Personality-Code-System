import { and, isNotNull, isNull, lt } from 'drizzle-orm';
import retentionPolicy from '../../../data/analytics/retention-policy-v0.1-dev.json';
import type { PcsDatabase } from './database';
import { productEvents } from './analyticsSchema';

export const ANALYTICS_RETENTION_POLICY_VERSION = retentionPolicy.retention_policy_version;
export const UNSCOPED_ANALYTICS_RETENTION_DAYS = retentionPolicy.unscoped_retention_days;
export const SESSION_ANALYTICS_RETENTION_DAYS = retentionPolicy.session_bound_retention_days;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface AnalyticsRetentionCleanupResult {
  asOf: Date;
  unscopedCutoff: Date;
  sessionBoundCutoff: Date;
  deletedUnscoped: number;
  deletedSessionBound: number;
}

export async function cleanupExpiredFirstPartyAnalytics(
  db: PcsDatabase,
  input: {
    asOf?: Date;
    unscopedRetentionDays?: number;
    sessionBoundRetentionDays?: number;
  } = {}
): Promise<AnalyticsRetentionCleanupResult> {
  const asOf = input.asOf ?? new Date();
  const unscopedRetentionDays =
    input.unscopedRetentionDays ?? UNSCOPED_ANALYTICS_RETENTION_DAYS;
  const sessionBoundRetentionDays =
    input.sessionBoundRetentionDays ?? SESSION_ANALYTICS_RETENTION_DAYS;

  if (!(asOf instanceof Date) || Number.isNaN(asOf.getTime())) {
    throw new Error('Analytics retention cleanup requires a valid asOf Date');
  }
  for (const [label, days] of [
    ['unscopedRetentionDays', unscopedRetentionDays],
    ['sessionBoundRetentionDays', sessionBoundRetentionDays]
  ] as const) {
    if (!Number.isSafeInteger(days) || days < 1 || days > 3650) {
      throw new Error(`${label} must be an integer from 1 to 3650`);
    }
  }

  const unscopedCutoff = new Date(asOf.getTime() - unscopedRetentionDays * DAY_MS);
  const sessionBoundCutoff = new Date(asOf.getTime() - sessionBoundRetentionDays * DAY_MS);

  const deletedUnscoped = await db
    .delete(productEvents)
    .where(
      and(
        isNull(productEvents.sessionId),
        lt(productEvents.createdAt, unscopedCutoff)
      )
    )
    .returning({ eventId: productEvents.eventId });

  const deletedSessionBound = await db
    .delete(productEvents)
    .where(
      and(
        isNotNull(productEvents.sessionId),
        lt(productEvents.createdAt, sessionBoundCutoff)
      )
    )
    .returning({ eventId: productEvents.eventId });

  return {
    asOf,
    unscopedCutoff,
    sessionBoundCutoff,
    deletedUnscoped: deletedUnscoped.length,
    deletedSessionBound: deletedSessionBound.length
  };
}
