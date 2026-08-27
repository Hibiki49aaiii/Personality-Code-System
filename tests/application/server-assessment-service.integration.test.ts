import test from 'node:test';
import assert from 'node:assert/strict';
import { createPcsDatabaseConnection } from '../../src/infrastructure/persistence/database';
import { PersistenceError } from '../../src/infrastructure/persistence/anonymousAssessmentRepository';
import { getObservedTypeDistribution } from '../../src/infrastructure/persistence/typeDistributionRepository';
import {
  completePublicAssessment,
  getPrivateRenderedAssessmentResult,
  savePublicAssessmentAnswer,
  startOrResumeAnonymousAssessment
} from '../../src/application/assessment/serverAssessmentService';

const databaseUrl = process.env.DATABASE_URL;
assert.ok(databaseUrl, 'DATABASE_URL is required');

test('anonymous reviewed-model flow renders detailed deterministic v0.3 content with no fallback-only result domains', async () => {
  const connection = createPcsDatabaseConnection(databaseUrl);
  try {
    const started = await startOrResumeAnonymousAssessment(connection.db);
    assert.equal(started.created, true);
    assert.equal(started.state.status, 'in_progress');
    assert.equal(started.state.modelVersion, 'assessment-dev-v0.3');
    assert.equal(started.state.items.length, 147);
    assert.equal(started.state.answers.length, 0);
    assert.equal(started.state.responseScale.version, 'likert-5-ja-v0.1');

    const firstItem = started.state.items[0];
    await savePublicAssessmentAnswer(connection.db, { token: started.token, itemId: firstItem.id, value: 4 });
    const resumed = await startOrResumeAnonymousAssessment(connection.db, started.token);
    assert.equal(resumed.created, false);
    assert.deepEqual(resumed.state.answers, [{ itemId: firstItem.id, value: 4 }]);

    for (const item of started.state.items) {
      await savePublicAssessmentAnswer(connection.db, { token: started.token, itemId: item.id, value: 3 });
    }

    const completed = await completePublicAssessment(connection.db, started.token);
    assert.equal(completed.alreadyCompleted, false);
    assert.equal(completed.snapshot.versions.assessmentModelVersion, 'assessment-dev-v0.3');
    assert.equal(completed.snapshot.versions.contentVersion, 'content-dev-v0.3');
    assert.equal(completed.snapshot.snapshotSchemaVersion, 'result-snapshot-v0.2-dev');
    assert.ok('assets' in completed.snapshot);
    if ('assets' in completed.snapshot) assert.equal(completed.snapshot.assets.illustrationAssetVersion, 'ILL-PCS-FALLBACK-HERO-v01');
    assert.equal(completed.snapshot.traitScores.length, 21);
    assert.equal(completed.snapshot.personalityCode.coreCode, 'SVAEND');
    assert.equal(completed.snapshot.sections.length, 18);
    assert.ok(completed.snapshot.content.selectedIds.includes('DEV-TYPE-SVAEND-IDENTITY'));
    assert.ok(completed.snapshot.content.selectedIds.includes('DEV-TYPE-SVAEND-STRENGTHS'));
    assert.ok(completed.snapshot.content.selectedIds.includes('DEV-TYPE-SVAEND-ADVERSARIAL'));
    assert.ok(completed.snapshot.content.selectedIds.includes('DEV-TRAIT-SYS-MID'));
    assert.ok(completed.snapshot.content.selectedIds.includes('DEV-TRAIT-RDP-MID'));
    assert.ok(completed.snapshot.content.selectedIds.includes('DEV-TRAIT-UNC-MID'));
    assert.equal(completed.snapshot.content.selectedIds.some((id) => id.startsWith('DEV-FALLBACK-')), false);
    for (const trait of completed.snapshot.traitScores) assert.equal(trait.scoreBp, 5000, trait.traitId);

    const duplicate = await completePublicAssessment(connection.db, started.token);
    assert.equal(duplicate.alreadyCompleted, true);
    assert.equal(duplicate.snapshotId, completed.snapshotId);
    assert.deepEqual(duplicate.snapshot, completed.snapshot);

    const distribution = await getObservedTypeDistribution(connection.db, {
      assessmentModelVersion: 'assessment-dev-v0.3',
      locale: 'ja-JP',
      startInclusive: new Date(Date.now() - 60 * 60 * 1000),
      endExclusive: new Date(Date.now() + 60 * 60 * 1000)
    });
    assert.equal(distribution.scope.assessmentModelVersion, 'assessment-dev-v0.3');
    assert.equal(distribution.scope.codeSchemaVersion, 'core-code-v0.1-dev');
    assert.equal(distribution.scope.locale, 'ja-JP');
    assert.equal(distribution.scope.eligibilityRule, 'all-completed-snapshots');
    assert.equal(distribution.populationClaimAllowed, false);
    assert.ok(distribution.sampleSize >= 1);
    const svaendObserved = distribution.entries.find((entry) => entry.coreCode === 'SVAEND');
    assert.ok(svaendObserved);
    assert.ok(svaendObserved.count >= 1);

    const rendered = await getPrivateRenderedAssessmentResult(connection.db, started.token);
    assert.ok(rendered);
    assert.equal(rendered.sections.length, 18);
    assert.ok(rendered.sections.every((section) => section.modules.length >= 1));
    const core = rendered.sections.find((section) => section.domain === 'core-identity');
    const thinking = rendered.sections.find((section) => section.domain === 'thinking');
    const love = rendered.sections.find((section) => section.domain === 'relationships-love');
    const stress = rendered.sections.find((section) => section.domain === 'stress');
    assert.ok(core?.modules.some((module) => module.text.includes('深度・開拓実行型 自律検証設計者')));
    assert.ok(thinking?.modules.some((module) => module.id === 'DEV-TRAIT-SYS-MID'));
    assert.ok(love?.modules.some((module) => module.id === 'DEV-TRAIT-RDP-MID'));
    assert.ok(stress?.modules.some((module) => module.id === 'DEV-TRAIT-UNC-MID'));

    await assert.rejects(
      () => savePublicAssessmentAnswer(connection.db, { token: started.token, itemId: firstItem.id, value: 5 }),
      (error: unknown) => error instanceof PersistenceError && error.code === 'SESSION_NOT_WRITABLE'
    );
  } finally {
    await connection.close();
  }
});
