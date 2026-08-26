import test from 'node:test';
import assert from 'node:assert/strict';
import { createPcsDatabaseConnection } from '../../src/infrastructure/persistence/database';
import {
  AssessmentModelRepositoryError,
  getAssessmentDeliveryModel,
  getAssessmentScoringModel
} from '../../src/infrastructure/persistence/assessmentModelRepository';

test('three development releases expose the same 147 reviewed scoring items while content versions advance independently', async () => {
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, 'DATABASE_URL is required');
  const connection = createPcsDatabaseConnection(databaseUrl);

  try {
    const versions = ['assessment-dev-v0.1', 'assessment-dev-v0.2', 'assessment-dev-v0.3'];
    for (const modelVersion of versions) {
      const delivery = await getAssessmentDeliveryModel(connection.db, {
        modelVersion,
        locale: 'ja-JP',
        allowedStatuses: ['beta']
      });
      assert.equal(delivery.items.length, 147);
      assert.equal(delivery.items[0]?.id, 'PCS-SYS-001');
      assert.equal(delivery.items[146]?.position, 147);
      assert.equal(delivery.responseScale.version, 'likert-5-ja-v0.1');
      const publicShape = delivery.items[0] as unknown as Record<string, unknown>;
      for (const hiddenKey of ['traitId','trait_id','direction','weightMilli','weight_milli']) {
        assert.equal(hiddenKey in publicShape, false, hiddenKey);
      }
      const knownR2 = delivery.items.find((item) => item.id === 'PCS-SYS-004');
      assert.equal(knownR2?.revision, 'r2');
    }

    const models = await Promise.all(versions.map((modelVersion) => getAssessmentScoringModel(connection.db, {
      modelVersion,
      locale: 'ja-JP',
      allowedStatuses: ['beta']
    })));
    assert.deepEqual(models.map((model) => model.contentVersion), ['content-dev-v0.1','content-dev-v0.2','content-dev-v0.3']);
    for (const model of models) {
      assert.equal(model.items.length, 147);
      assert.equal(model.scoringVersion, 'scoring-v0.1-dev');
      assert.equal(model.codeSchemaVersion, 'core-code-v0.1-dev');
      assert.equal(model.interactionVersion, 'trait-interactions-v0.1');
    }
    assert.deepEqual(models[1].items, models[0].items, 'v0.2 must not alter scoring keys');
    assert.deepEqual(models[2].items, models[0].items, 'v0.3 must not alter scoring keys');

    assert.deepEqual(models[2].items[0], {
      id: 'PCS-SYS-001', traitId: 'SYS', direction: 1, weightMilli: 1000, required: true
    });
    assert.deepEqual(models[2].items.find((item) => item.id === 'PCS-SYS-005'), {
      id: 'PCS-SYS-005', traitId: 'SYS', direction: -1, weightMilli: 1000, required: true
    });

    await assert.rejects(
      () => getAssessmentDeliveryModel(connection.db, {
        modelVersion: 'assessment-dev-v0.3', locale: 'en-US', allowedStatuses: ['beta']
      }),
      (error: unknown) => error instanceof AssessmentModelRepositoryError && error.code === 'MODEL_NOT_DELIVERABLE'
    );
  } finally {
    await connection.close();
  }
});
