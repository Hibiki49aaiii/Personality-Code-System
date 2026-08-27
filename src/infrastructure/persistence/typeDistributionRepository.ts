import { and, eq, gte, lt, sql } from 'drizzle-orm';
import {
  buildObservedTypeDistribution,
  type ObservedTypeDistribution
} from '../../domain/analytics/observedTypeDistribution';
import type { PcsDatabase } from './database';
import { assessmentModelReleases, resultSnapshots } from './schema';

export async function getObservedTypeDistribution(
  db: PcsDatabase,
  input: {
    assessmentModelVersion: string;
    locale: string;
    startInclusive: Date;
    endExclusive: Date;
  }
): Promise<ObservedTypeDistribution> {
  if (
    !(input.startInclusive instanceof Date) ||
    !(input.endExclusive instanceof Date) ||
    Number.isNaN(input.startInclusive.getTime()) ||
    Number.isNaN(input.endExclusive.getTime()) ||
    input.startInclusive >= input.endExclusive
  ) {
    throw new Error('A valid observed-distribution time range is required');
  }

  const [model] = await db
    .select({
      modelVersion: assessmentModelReleases.modelVersion,
      codeSchemaVersion: assessmentModelReleases.codeSchemaVersion,
      locale: assessmentModelReleases.locale
    })
    .from(assessmentModelReleases)
    .where(eq(assessmentModelReleases.modelVersion, input.assessmentModelVersion))
    .limit(1);

  if (!model) throw new Error(`Unknown assessment model ${input.assessmentModelVersion}`);
  if (model.locale !== input.locale) {
    throw new Error('Observed distribution locale must match the assessment model locale');
  }

  const coreCodeExpression = sql<string>`${resultSnapshots.snapshotJson} #>> '{personalityCode,coreCode}'`;
  const rows = await db
    .select({
      coreCode: coreCodeExpression,
      count: sql<number>`count(*)::int`
    })
    .from(resultSnapshots)
    .where(
      and(
        eq(resultSnapshots.assessmentModelVersion, input.assessmentModelVersion),
        eq(resultSnapshots.codeSchemaVersion, model.codeSchemaVersion),
        eq(resultSnapshots.locale, input.locale),
        gte(resultSnapshots.createdAt, input.startInclusive),
        lt(resultSnapshots.createdAt, input.endExclusive)
      )
    )
    .groupBy(coreCodeExpression);

  return buildObservedTypeDistribution(
    {
      assessmentModelVersion: model.modelVersion,
      codeSchemaVersion: model.codeSchemaVersion,
      locale: model.locale,
      startInclusive: input.startInclusive.toISOString(),
      endExclusive: input.endExclusive.toISOString(),
      eligibilityRule: 'all-completed-snapshots'
    },
    rows
  );
}
