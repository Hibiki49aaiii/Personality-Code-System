import test from 'node:test';
import assert from 'node:assert/strict';
import { createPcsDatabaseConnection } from '../../src/infrastructure/persistence/database';
import {
  AssessmentModelRepositoryError,
  getAssessmentDeliveryModel,
  getAssessmentScoringModel
} from '../../src/infrastructure/persistence/assessmentModelRepository';

test('delivery model exposes 147 reviewed questions without scoring keys while server scoring model keeps exact keys', async () => {
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, 'DATABASE_URL is required');
  const connection = createPcsDatabaseConnection(databaseUrl);

  try {
    const delivery = await getAssessmentDeliveryModel(connection.db, {
      modelVersion: 'assessment-dev-v0.1',
      locale: 'ja-JP',
      allowedStatuses: ['beta']
    });
    assert.equal(delivery.items.length, 147);
    assert.equal(delivery.items[0]?.position, 1);
    assert.equal(delivery.items[0]?.id, 'PCS-SYS-001');
    assert.equal(delivery.items[146]?.position, 147);
    assert.equal(delivery.responseScale.version, 'likert-5-ja-v0.1');
    assert.deepEqual(delivery.responseScale.values.map((entry) => entry.value), [1, 2, 3, 4, 5]);

    const publicShape = delivery.items[0] as unknown as Record<string, unknown>;
    assert.equal('traitId' in publicShape, false);
    assert.equal('trait_id' in publicShape, false);
    assert.equal('direction' in publicShape, false);
    assert.equal('weightMilli' in publicShape, false);
    assert.equal('weight_milli' in publicShape, false);

    const knownR2 = delivery.items.find((item) => item.id === 'PCS-SYS-004');
    assert.ok(knownR2);
    assert.equal(knownR2.revision, 'r2');
    assert.equal(
      knownR2.text,
      '複数の工程や要素が関わる問題では、前後の依存関係を整理してから考えることが多い。'
    );

    const scoring = await getAssessmentScoringModel(connection.db, {
      modelVersion: 'assessment-dev-v0.1',
      locale: 'ja-JP',
      allowedStatuses: ['beta']
    });
    assert.equal(scoring.items.length, 147);
    assert.equal(scoring.scoringVersion, 'scoring-v0.1-dev');
    assert.equal(scoring.codeSchemaVersion, 'core-code-v0.1-dev');
    assert.equal(scoring.interactionVersion, 'trait-interactions-v0.1');
    assert.equal(scoring.contentVersion, 'content-dev-v0.1');
    assert.deepEqual(scoring.items[0], {
      id: 'PCS-SYS-001',
      traitId: 'SYS',
      direction: 1,
      weightMilli: 1000,
      required: true
    });
    assert.deepEqual(scoring.items.find((item) => item.id === 'PCS-SYS-005'), {
      id: 'PCS-SYS-005',
      traitId: 'SYS',
      direction: -1,
      weightMilli: 1000,
      required: true
    });

    await assert.rejects(
      () => getAssessmentDeliveryModel(connection.db, {
        modelVersion: 'assessment-dev-v0.1',
        locale: 'en-US',
        allowedStatuses: ['beta']
      }),
      (error: unknown) => error instanceof AssessmentModelRepositoryError && error.code === 'MODEL_NOT_DELIVERABLE'
    );
  } finally {
    await connection.close();
  }
});
