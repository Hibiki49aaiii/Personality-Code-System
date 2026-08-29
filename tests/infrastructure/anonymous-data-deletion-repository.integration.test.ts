import test from 'node:test';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import type { StructuredAssessmentResult } from '../../src/domain/assessment/resultEngine';
import { DEVELOPMENT_FALLBACK_ILLUSTRATION_ASSET_VERSION } from '../../src/domain/illustration/fallbackAsset';
import {
  completeAnonymousAssessment,
  createAnonymousAssessmentSession,
  getPrivateResultByAnonymousToken,
  saveAnonymousAssessmentAnswer
} from '../../src/infrastructure/persistence/anonymousAssessmentRepository';
import {
  deleteAnonymousAssessmentDataByToken
} from '../../src/infrastructure/persistence/anonymousDataDeletionRepository';
import { createPcsDatabaseConnection } from '../../src/infrastructure/persistence/database';
import {
  createPublicShareForPrivateResult,
  getPublicShareByToken
} from '../../src/infrastructure/persistence/publicShareRepository';
import {
  anonymousSessions,
  assessmentAnswers,
  assessmentTraitScores,
  resultSnapshots
} from '../../src/infrastructure/persistence/schema';
import { publicShareSnapshots } from '../../src/infrastructure/persistence/sharingSchema';
import { productEvents } from '../../src/infrastructure/persistence/analyticsSchema';
import {
  calibrationConsentReceipts,
  calibrationDeletionEvents,
  calibrationRecordLinks
} from '../../src/infrastructure/persistence/calibrationSchema';

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
      extendedCode: 'PCSX1~deletion-fixture'
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

test('bearer-owned deletion removes diagnostic rows, session analytics, and all derived public share snapshots', async () => {
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, 'DATABASE_URL is required');
  const connection = createPcsDatabaseConnection(databaseUrl);

  try {
    const session = await createAnonymousAssessmentSession(connection.db, {
      modelVersion: 'assessment-dev-v0.1',
      locale: 'ja-JP',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      allowedModelStatuses: ['published']
    });

    await saveAnonymousAssessmentAnswer(connection.db, {
      token: session.token,
      itemId: 'PCS-SYS-001',
      itemRevision: 'r1',
      locale: 'ja-JP',
      value: 3
    });

    await completeAnonymousAssessment(connection.db, {
      token: session.token,
      result: oneTraitResult(),
      illustrationAssetVersion: DEVELOPMENT_FALLBACK_ILLUSTRATION_ASSET_VERSION
    });

    const firstShare = await createPublicShareForPrivateResult(connection.db, {
      privateToken: session.token
    });
    const secondShare = await createPublicShareForPrivateResult(connection.db, {
      privateToken: session.token
    });

    await connection.db.insert(productEvents).values({
      sessionId: session.sessionId,
      eventDictionaryVersion: 'analytics-events-v0.1-dev',
      eventName: 'result_viewed',
      eventSource: 'server',
      propertiesJson: {}
    });

    const [calibrationConsent] = await connection.db.insert(calibrationConsentReceipts).values({
      sessionId: session.sessionId,
      assessmentModelVersion: 'assessment-dev-v0.1',
      consentVersion: 'calibration-consent-ja-v0.1-dev',
      purposeId: 'psychometric-calibration-v0.1',
      locale: 'ja-JP'
    }).returning({ consentReceiptId: calibrationConsentReceipts.consentReceiptId });

    const [calibrationLink] = await connection.db.insert(calibrationRecordLinks).values({
      consentReceiptId: calibrationConsent.consentReceiptId
    }).returning({ calibrationRecordId: calibrationRecordLinks.calibrationRecordId });

    const deletion = await deleteAnonymousAssessmentDataByToken(connection.db, session.token);
    assert.equal(deletion.sessionId, session.sessionId);
    assert.equal(deletion.deletedPublicShareCount, 2);
    assert.equal(deletion.hadCompletedResult, true);

    assert.equal(await getPrivateResultByAnonymousToken(connection.db, session.token), null);
    assert.equal(await getPublicShareByToken(connection.db, firstShare.token), null);
    assert.equal(await getPublicShareByToken(connection.db, secondShare.token), null);

    const [sessions, answers, scores, results, shares, analytics, calibrationConsents, calibrationLinks, deletionEvents] = await Promise.all([
      connection.db.select().from(anonymousSessions).where(eq(anonymousSessions.sessionId, session.sessionId)),
      connection.db.select().from(assessmentAnswers).where(eq(assessmentAnswers.sessionId, session.sessionId)),
      connection.db.select().from(assessmentTraitScores).where(eq(assessmentTraitScores.sessionId, session.sessionId)),
      connection.db.select().from(resultSnapshots).where(eq(resultSnapshots.sessionId, session.sessionId)),
      connection.db.select().from(publicShareSnapshots).where(eq(publicShareSnapshots.shareSnapshotId, firstShare.shareSnapshotId)),
      connection.db.select().from(productEvents).where(eq(productEvents.sessionId, session.sessionId)),
      connection.db.select().from(calibrationConsentReceipts).where(eq(calibrationConsentReceipts.sessionId, session.sessionId)),
      connection.db.select().from(calibrationRecordLinks).where(eq(calibrationRecordLinks.calibrationRecordId, calibrationLink.calibrationRecordId)),
      connection.db.select().from(calibrationDeletionEvents).where(eq(calibrationDeletionEvents.calibrationRecordId, calibrationLink.calibrationRecordId))
    ]);

    assert.equal(sessions.length, 0);
    assert.equal(answers.length, 0);
    assert.equal(scores.length, 0);
    assert.equal(results.length, 0);
    assert.equal(shares.length, 0);
    assert.equal(analytics.length, 0);
    assert.equal(calibrationConsents.length, 0);
    assert.equal(calibrationLinks.length, 0);
    assert.deepEqual(deletionEvents.map((event) => event.reason), ['owner-session-deleted']);
  } finally {
    await connection.close();
  }
});
