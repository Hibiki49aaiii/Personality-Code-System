import test from 'node:test';
import assert from 'node:assert/strict';
import { eq, sql } from 'drizzle-orm';
import { createAnonymousAssessmentSession } from '../../src/infrastructure/persistence/anonymousAssessmentRepository';
import { productEvents } from '../../src/infrastructure/persistence/analyticsSchema';
import {
  FirstPartyAnalyticsError,
  recordFirstPartyProductEvent
} from '../../src/infrastructure/persistence/analyticsRepository';
import { createPcsDatabaseConnection } from '../../src/infrastructure/persistence/database';
import { cleanupExpiredFirstPartyAnalytics } from '../../src/infrastructure/persistence/analyticsRetentionRepository';

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

    // Session deletion represents user-data deletion/retention cleanup; linked analytics must disappear too.
    await connection.db.execute(
      sql`DELETE FROM anonymous_sessions WHERE session_id = ${session.sessionId}`
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


test('analytics retention cleanup enforces 30-day unscoped and 90-day session-bound maxima', async () => {
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, 'DATABASE_URL is required');
  const connection = createPcsDatabaseConnection(databaseUrl);
  const asOf = new Date('2026-08-27T00:00:00.000Z');

  try {
    const session = await createAnonymousAssessmentSession(connection.db, {
      modelVersion: 'assessment-dev-v0.1',
      locale: 'ja-JP',
      expiresAt: new Date('2027-01-01T00:00:00.000Z'),
      allowedModelStatuses: ['published']
    });

    const oldUnscoped = await recordFirstPartyProductEvent(connection.db, {
      name: 'landing_viewed',
      source: 'client',
      properties: { viewportCategory: 'desktop', locale: 'ja-JP' }
    });
    const recentUnscoped = await recordFirstPartyProductEvent(connection.db, {
      name: 'landing_viewed',
      source: 'client',
      properties: { viewportCategory: 'mobile', locale: 'ja-JP' }
    });
    const oldSessionBound = await recordFirstPartyProductEvent(connection.db, {
      name: 'question_viewed',
      source: 'client',
      privateToken: session.token,
      properties: { itemPosition: 1 }
    });
    const recentSessionBound = await recordFirstPartyProductEvent(connection.db, {
      name: 'question_viewed',
      source: 'client',
      privateToken: session.token,
      properties: { itemPosition: 2 }
    });

    await connection.db
      .update(productEvents)
      .set({ createdAt: new Date('2026-07-01T00:00:00.000Z') })
      .where(eq(productEvents.eventId, oldUnscoped.eventId));
    await connection.db
      .update(productEvents)
      .set({ createdAt: new Date('2026-08-10T00:00:00.000Z') })
      .where(eq(productEvents.eventId, recentUnscoped.eventId));
    await connection.db
      .update(productEvents)
      .set({ createdAt: new Date('2026-05-01T00:00:00.000Z') })
      .where(eq(productEvents.eventId, oldSessionBound.eventId));
    await connection.db
      .update(productEvents)
      .set({ createdAt: new Date('2026-07-01T00:00:00.000Z') })
      .where(eq(productEvents.eventId, recentSessionBound.eventId));

    const cleanup = await cleanupExpiredFirstPartyAnalytics(connection.db, { asOf });
    assert.equal(cleanup.unscopedCutoff.toISOString(), '2026-07-28T00:00:00.000Z');
    assert.equal(cleanup.sessionBoundCutoff.toISOString(), '2026-05-29T00:00:00.000Z');
    assert.ok(cleanup.deletedUnscoped >= 1);
    assert.ok(cleanup.deletedSessionBound >= 1);

    const oldUnscopedRow = await connection.db
      .select({ eventId: productEvents.eventId })
      .from(productEvents)
      .where(eq(productEvents.eventId, oldUnscoped.eventId));
    const recentUnscopedRow = await connection.db
      .select({ eventId: productEvents.eventId })
      .from(productEvents)
      .where(eq(productEvents.eventId, recentUnscoped.eventId));
    const oldSessionRow = await connection.db
      .select({ eventId: productEvents.eventId })
      .from(productEvents)
      .where(eq(productEvents.eventId, oldSessionBound.eventId));
    const recentSessionRow = await connection.db
      .select({ eventId: productEvents.eventId })
      .from(productEvents)
      .where(eq(productEvents.eventId, recentSessionBound.eventId));

    assert.equal(oldUnscopedRow.length, 0);
    assert.equal(oldSessionRow.length, 0);
    assert.equal(recentUnscopedRow.length, 1);
    assert.equal(recentSessionRow.length, 1);

    await connection.db
      .delete(productEvents)
      .where(eq(productEvents.eventId, recentUnscoped.eventId));
    await connection.db.execute(
      sql`DELETE FROM anonymous_sessions WHERE session_id = ${session.sessionId}`
    );
  } finally {
    await connection.close();
  }
});
