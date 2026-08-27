import test from 'node:test';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import type { StructuredAssessmentResult } from '../../src/domain/assessment/resultEngine';
import {
  completeAnonymousAssessment,
  createAnonymousAssessmentSession,
  saveAnonymousAssessmentAnswer
} from '../../src/infrastructure/persistence/anonymousAssessmentRepository';
import { createPcsDatabaseConnection } from '../../src/infrastructure/persistence/database';
import {
  createPublicShareForPrivateResult,
  getPublicShareByToken,
  revokePublicSharesForPrivateResult
} from '../../src/infrastructure/persistence/publicShareRepository';
import { hashPublicShareToken } from '../../src/infrastructure/persistence/publicShareToken';
import { publicShareSnapshots } from '../../src/infrastructure/persistence/sharingSchema';
import { DEVELOPMENT_FALLBACK_ILLUSTRATION_ASSET_VERSION } from '../../src/domain/illustration/fallbackAsset';

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
      extendedCode: 'PCSX1~must-never-be-public'
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
      texts: ['private fixture']
    }]
  };
}

test('repository creates multiple hash-only sanitized links and private owner can revoke all', async () => {
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
    const completed = await completeAnonymousAssessment(connection.db, {
      token: session.token,
      result: oneTraitResult(),
      illustrationAssetVersion: DEVELOPMENT_FALLBACK_ILLUSTRATION_ASSET_VERSION
    });

    const first = await createPublicShareForPrivateResult(connection.db, {
      privateToken: session.token
    });

    await assert.rejects(
      () => createPublicShareForPrivateResult(connection.db, {
        privateToken: session.token,
        presentation: {
          displayName: null,
          identitySentence: null,
          illustrationAssetVersion: 'ILL-MISMATCH-HERO-v01'
        }
      }),
      /illustration asset version does not match source result snapshot/i
    );
    const second = await createPublicShareForPrivateResult(connection.db, {
      privateToken: session.token
    });

    assert.notEqual(first.token, second.token);
    assert.equal(first.snapshot.coreCode, 'SVAEND');
    assert.equal(first.snapshot.presentation.displayName, null);
    assert.equal(first.snapshot.presentation.illustrationAssetVersion, DEVELOPMENT_FALLBACK_ILLUSTRATION_ASSET_VERSION);

    const [stored] = await connection.db
      .select({
        publicTokenHash: publicShareSnapshots.publicTokenHash,
        sourceResultSnapshotId: publicShareSnapshots.sourceResultSnapshotId,
        shareJson: publicShareSnapshots.shareJson
      })
      .from(publicShareSnapshots)
      .where(eq(publicShareSnapshots.shareSnapshotId, first.shareSnapshotId))
      .limit(1);

    assert.ok(stored);
    assert.equal(stored.publicTokenHash, hashPublicShareToken(first.token));
    assert.notEqual(stored.publicTokenHash, first.token);
    assert.equal(stored.sourceResultSnapshotId, completed.snapshotId);

    const publicJson = JSON.stringify(stored.shareJson);
    for (const forbidden of ['traitScores', 'responseQuality', 'extendedCode', 'sections', 'answers']) {
      assert.equal(publicJson.includes(forbidden), false, `stored public share leaked ${forbidden}`);
    }

    const publicFirst = await getPublicShareByToken(connection.db, first.token);
    const publicSecond = await getPublicShareByToken(connection.db, second.token);
    assert.equal(publicFirst?.snapshot.coreCode, 'SVAEND');
    assert.equal(publicSecond?.snapshot.coreCode, 'SVAEND');
    assert.equal(await getPublicShareByToken(connection.db, 'not-a-token'), null);

    const revoked = await revokePublicSharesForPrivateResult(connection.db, session.token);
    assert.equal(revoked.revokedCount, 2);
    assert.equal(await getPublicShareByToken(connection.db, first.token), null);
    assert.equal(await getPublicShareByToken(connection.db, second.token), null);
  } finally {
    await connection.close();
  }
});
