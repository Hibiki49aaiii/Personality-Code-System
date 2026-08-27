export const OBSERVED_TYPE_DISTRIBUTION_SCHEMA_VERSION =
  'observed-type-distribution-v0.1-dev' as const;

export interface ObservedTypeDistributionScope {
  assessmentModelVersion: string;
  codeSchemaVersion: string;
  locale: string;
  startInclusive: string;
  endExclusive: string;
  eligibilityRule: 'all-completed-snapshots';
}

export interface ObservedTypeDistributionEntry {
  coreCode: string;
  count: number;
  shareBp: number;
}

export interface ObservedTypeDistribution {
  schemaVersion: typeof OBSERVED_TYPE_DISTRIBUTION_SCHEMA_VERSION;
  scope: ObservedTypeDistributionScope;
  sampleSize: number;
  entries: ObservedTypeDistributionEntry[];
  populationClaimAllowed: false;
}

function parseIso(value: string, label: string): number {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) throw new Error(`${label} must be an ISO date-time`);
  return time;
}

export function buildObservedTypeDistribution(
  scope: ObservedTypeDistributionScope,
  groupedCounts: ReadonlyArray<{ coreCode: string; count: number }>
): ObservedTypeDistribution {
  if (!scope.assessmentModelVersion || !scope.codeSchemaVersion || !scope.locale) {
    throw new Error('Observed distribution requires explicit model/code/locale scope');
  }

  const start = parseIso(scope.startInclusive, 'startInclusive');
  const end = parseIso(scope.endExclusive, 'endExclusive');
  if (start >= end) throw new Error('Observed distribution requires startInclusive < endExclusive');

  const merged = new Map<string, number>();
  for (const row of groupedCounts) {
    if (!/^[A-Z0-9]{2,32}$/.test(row.coreCode)) {
      throw new Error(`Invalid Core Code in observed distribution: ${row.coreCode}`);
    }
    if (!Number.isSafeInteger(row.count) || row.count < 0) {
      throw new Error(`Invalid observed count for ${row.coreCode}`);
    }
    merged.set(row.coreCode, (merged.get(row.coreCode) ?? 0) + row.count);
  }

  const sampleSize = [...merged.values()].reduce((sum, count) => sum + count, 0);
  const entries = [...merged.entries()]
    .filter(([, count]) => count > 0)
    .map(([coreCode, count]) => ({
      coreCode,
      count,
      shareBp: sampleSize === 0 ? 0 : Math.round((count * 10_000) / sampleSize)
    }))
    .sort((a, b) => b.count - a.count || a.coreCode.localeCompare(b.coreCode));

  return {
    schemaVersion: OBSERVED_TYPE_DISTRIBUTION_SCHEMA_VERSION,
    scope,
    sampleSize,
    entries,
    populationClaimAllowed: false
  };
}
