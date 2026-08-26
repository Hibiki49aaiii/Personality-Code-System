import test from 'node:test';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import { createAnonymousAssessmentSession } from '../../src/infrastructure/persistence/anonymousAssessmentRepository';
import { productEvents } from '../../src/infrastructure/persistence/analyticsSchema';
import {
  FirstPartyAnalyticsError,
  recordFirstPartyProductEvent
} from '../../src/infrastructure/persistence/analyticsRepository';
import { createPcsDatabaseConnection } from '../../src/infrastructure/persistence/database';

test('first-party analytics binds required events to the authenticated session and never trusts client modelVersion', async () => {
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, 'DATABASE_URL is required');
  const connection = createPcsDatabaseConnection(databaseUrl);

  try {
    const landing = await recordFirstPartyProductEvent(connection.db, {
      name: 'landing_viewed',
      source: 'client',
      properties: { viewportCategory: 'desktop', locale: 'ja-JP' }
    });
    assert.equal(landing.sessionId, null);

    const session = await createAnonymousAssessmentSession(connection.db, {
      modelVersion: 'assessment-dev-v0.1',
      locale: 'ja-JP',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      allowedModelStatuses: ['published']
    });

    const viewed = await recordFirstPartyProductEvent(connection.db, {
      name: 'question_viewed',
      source: 'client',
      privateToken: session.token,
      properties: { itemPosition: 1 }
    });
    assert.equal(viewed.sessionId, session.sessionId);
    assert.deepEqual(viewed.event.properties, {
      itemPosition: 1,
      modelVersion: 'assessment-dev-v0.1'
    });

    await assert.rejects(
      () => recordFirstPartyProductEvent(connection.db, {
        name: 'question_viewed',
        source: 'client',
        privateToken: session.token,
        properties: { itemPosition: 1, modelVersion: 'forged-model' }
      }),
      (error: unknown) =>
        error instanceof FirstPartyAnalyticsError &&
        error.code === 'SESSION_MODEL_MISMATCH'
    );

    await assert.rejects(
      () => recordFirstPartyProductEvent(connection.db, {
        name: 'answer_interaction',
        source: 'client',
        privateToken: session.token,
        properties: {
          itemPosition: 1,
          interactionType: 'selected',
          answerValue: 5
        }
      }),
      /prohibited property answerValue/
    );

    const stored = await connection.db
      .select({
        eventName: productEvents.eventName,
        properties: productEvents.propertiesJson
      })
      .from(productEvents)
      .where(eq(productEvents.sessionId, session.sessionId));
    assert.equal(stored.length, 1);
    assert.equal(stored[0]?.eventName, 'question_viewed');
    assert.equal('answerValue' in (stored[0]?.properties ?? {}), false);

    await connection.db.execute(
      // Session deletion represents user-data deletion/retention cleanup; linked analytics must disappear too.
      // Drizzle sql template is avoided here so this test stays focused on FK behavior.
      { sql: 'DELETE FROM anonymous_sessions WHERE session_id = $1', params: [session.sessionId] } as never
    );

    const afterDelete = await connection.db
      .select({ eventId: productEvents.eventId })
      .from(productEvents)
      .where(eq(productEvents.sessionId, session.sessionId));
    assert.equal(afterDelete.length, 0);
  } finally {
    await connection.close();
  }
});
