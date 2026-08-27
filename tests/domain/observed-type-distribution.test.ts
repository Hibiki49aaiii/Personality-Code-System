import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildObservedTypeDistribution,
  OBSERVED_TYPE_DISTRIBUTION_SCHEMA_VERSION
} from '../../src/domain/analytics/observedTypeDistribution';

const scope = {
  assessmentModelVersion: 'assessment-v1',
  codeSchemaVersion: 'code-v1',
  locale: 'ja-JP',
  startInclusive: '2026-08-01T00:00:00.000Z',
  endExclusive: '2026-09-01T00:00:00.000Z',
  eligibilityRule: 'all-completed-snapshots' as const
};

test('observed type distribution reports only scoped sample counts and shares', () => {
  const distribution = buildObservedTypeDistribution(scope, [
    { coreCode: 'AAAAAA', count: 2 },
    { coreCode: 'BBBBBB', count: 1 },
    { coreCode: 'AAAAAA', count: 1 }
  ]);

  assert.equal(distribution.schemaVersion, OBSERVED_TYPE_DISTRIBUTION_SCHEMA_VERSION);
  assert.equal(distribution.sampleSize, 4);
  assert.equal(distribution.populationClaimAllowed, false);
  assert.deepEqual(distribution.entries, [
    { coreCode: 'AAAAAA', count: 3, shareBp: 7500 },
    { coreCode: 'BBBBBB', count: 1, shareBp: 2500 }
  ]);
  assert.deepEqual(distribution.scope, scope);
});

test('observed type distribution fails closed on missing scope or invalid counts', () => {
  assert.throws(
    () => buildObservedTypeDistribution({ ...scope, assessmentModelVersion: '' }, []),
    /explicit model/
  );
  assert.throws(
    () => buildObservedTypeDistribution(scope, [{ coreCode: 'AAAAAA', count: -1 }]),
    /Invalid observed count/
  );
  assert.throws(
    () => buildObservedTypeDistribution({ ...scope, endExclusive: scope.startInclusive }, []),
    /startInclusive < endExclusive/
  );
});
