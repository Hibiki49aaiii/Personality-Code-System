import test from 'node:test';
import assert from 'node:assert/strict';
import { createPcsDatabaseConnection } from '../../src/infrastructure/persistence/database';
import { PersistenceError } from '../../src/infrastructure/persistence/anonymousAssessmentRepository';
import {
  completePublicAssessment,
  getPrivateRenderedAssessmentResult,
  savePublicAssessmentAnswer,
  startOrResumeAnonymousAssessment
} from '../../src/application/assessment/serverAssessmentService';

const databaseUrl = process.env.DATABASE_URL;
assert.ok(databaseUrl, 'DATABASE_URL is required');

test('anonymous reviewed-model flow saves, resumes, completes idempotently, and renders private result', async () => {
  const connection = createPcsDatabaseConnection(databaseUrl);
  try {
    const started = await startOrResumeAnonymousAssessment(connection.db);
    assert.equal(started.created, true);
    assert.equal(started.state.status, 'in_progress');
    assert.equal(started.state.items.length, 147);
    assert.equal(started.state.answers.length, 0);
    assert.equal(started.state.responseScale.version, 'likert-5-ja-v0.1');

    const firstItem = started.state.items[0];
    await savePublicAssessmentAnswer(connection.db, {
      token: started.token,
      itemId: firstItem.id,
      value: 4
    });

    const resumed = await startOrResumeAnonymousAssessment(connection.db, started.token);
    assert.equal(resumed.created, false);
    assert.equal(resumed.token, started.token);
    assert.deepEqual(resumed.state.answers, [{ itemId: firstItem.id, value: 4 }]);

    for (const item of started.state.items) {
      await savePublicAssessmentAnswer(connection.db, {
        token: started.token,
        itemId: item.id,
        value: 3
      });
    }

    const completed = await completePublicAssessment(connection.db, started.token);
    assert.equal(completed.alreadyCompleted, false);
    assert.equal(completed.snapshot.traitScores.length, 21);
    assert.equal(completed.snapshot.personalityCode.coreCode, 'SVAEND');
    assert.equal(completed.snapshot.sections.length, 18);
    for (const trait of completed.snapshot.traitScores) {
      assert.equal(trait.scoreBp, 5000, trait.traitId);
    }

    const duplicate = await completePublicAssessment(connection.db, started.token);
    assert.equal(duplicate.alreadyCompleted, true);
    assert.equal(duplicate.snapshotId, completed.snapshotId);
    assert.deepEqual(duplicate.snapshot, completed.snapshot);

    const rendered = await getPrivateRenderedAssessmentResult(connection.db, started.token);
    assert.ok(rendered);
    assert.equal(rendered.snapshotId, completed.snapshotId);
    assert.equal(rendered.sections.length, 18);
    assert.ok(rendered.sections.every((section) => section.modules.length >= 1));

    await assert.rejects(
      () => savePublicAssessmentAnswer(connection.db, {
        token: started.token,
        itemId: firstItem.id,
        value: 5
      }),
      (error: unknown) =>
        error instanceof PersistenceError && error.code === 'SESSION_NOT_WRITABLE'
    );
  } finally {
    await connection.close();
  }
});
