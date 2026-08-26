import test from 'node:test';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import type { StructuredAssessmentResult } from '../../src/domain/assessment/resultEngine';
import { createPcsDatabaseConnection } from '../../src/infrastructure/persistence/database';
import {
  completeAnonymousAssessment,
  createAnonymousAssessmentSession,
  getPrivateResultByAnonymousToken,
  PersistenceError,
  saveAnonymousAssessmentAnswer
} from '../../src/infrastructure/persistence/anonymousAssessmentRepository';
import { hashAnonymousSessionToken } from '../../src/infrastructure/persistence/sessionToken';
import { anonymousSessions } from '../../src/infrastructure/persistence/schema';

function oneTraitResult(): StructuredAssessmentResult {
  return {
    versions: {
      resultSchemaVersion: 'structured-result-v0.1-dev',
      assessmentModelVersion: 'assessment-dev-v0.1',
      itemBankVersion: 'item-bank-v0.2',
      scoringVersion: 'scoring-v0.1-dev',
      codeSchemaVersion: 'core-code-v0.1-dev',
      interactionVersion: 'trait-interactions-v0.1',
      contentVersion: 'content-dev-v0.1'
    },
    locale: 'ja-JP',
    scoring: {
      scoringVersion: 'scoring-v0.1-dev',
      traitScores: [{
        traitId: 'SYS',
        keyedPointsWeighted: 2000,
        maxPointsWeighted: 4000,
        scoreBp: 5000,
        score: 50,
        displayScore: 50,
        answeredItems: 1
      }],
      responseQuality: {
        answerCount: 1,
        valueCounts: { 1: 0, 2: 0, 3: 1, 4: 0, 5: 0 },
        dominantResponseShareBp: 10000,
        extremeResponseShareBp: 0,
        flags: []
      }
    },
    personalityCode: {
      codeSchemaVersion: 'core-code-v0.1-dev',
      schemaToken: 'C01D',
      coreCode: 'SVAEND',
      dimensions: [],
      nearBoundaryCount: 0,
      extendedCode: 'PCSX1~repository-integration'
    },
    interactions: {
      interactionVersion: 'trait-interactions-v0.1',
      active: [],
      activeIds: []
    },
    content: {
      selected: [],
      suppressed: [],
      selectedIds: ['DEV-LIMIT-001'],
      suppressedIds: []
    },
    sections: [{
      domain: 'core-identity',
      moduleIds: ['DEV-LIMIT-001'],
      texts: ['fixture']
    }]
  };
}

test('repository creates hash-only session, persists answer/result atomically, and returns private result by bearer token', async () => {
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, 'DATABASE_URL is required');
  const connection = createPcsDatabaseConnection(databaseUrl);

  try {
    const created = await createAnonymousAssessmentSession(connection.db, {
      modelVersion: 'assessment-dev-v0.1',
      locale: 'ja-JP',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      allowedModelStatuses: ['published']
    });

    assert.match(created.token, /^[A-Za-z0-9_-]{43}$/);

    const [stored] = await connection.db
      .select({ accessTokenHash: anonymousSessions.accessTokenHash })
      .from(anonymousSessions)
      .where(eq(anonymousSessions.sessionId, created.sessionId))
      .limit(1);

    assert.ok(stored);
    assert.notEqual(stored.accessTokenHash, created.token);
    assert.equal(stored.accessTokenHash, hashAnonymousSessionToken(created.token));

    await saveAnonymousAssessmentAnswer(connection.db, {
      token: created.token,
      itemId: 'PCS-SYS-001',
      itemRevision: 'r1',
      locale: 'ja-JP',
      value: 3
    });

    const completed = await completeAnonymousAssessment(connection.db, {
      token: created.token,
      result: oneTraitResult()
    });

    assert.ok(completed.snapshotId);
    assert.equal(completed.snapshot.traitScores[0]?.scoreBp, 5000);

    const privateResult = await getPrivateResultByAnonymousToken(connection.db, created.token);
    assert.ok(privateResult);
    assert.equal(privateResult.snapshotId, completed.snapshotId);
    assert.equal(privateResult.snapshot.personalityCode.coreCode, 'SVAEND');
    assert.equal(privateResult.snapshot.versions.assessmentModelVersion, 'assessment-dev-v0.1');

    await assert.rejects(
      () => saveAnonymousAssessmentAnswer(connection.db, {
        token: created.token,
        itemId: 'PCS-SYS-001',
        itemRevision: 'r1',
        locale: 'ja-JP',
        value: 4
      }),
      (error: unknown) => error instanceof PersistenceError && error.code === 'SESSION_NOT_WRITABLE'
    );
  } finally {
    await connection.close();
  }
});
