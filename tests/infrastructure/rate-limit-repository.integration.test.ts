import test from 'node:test';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import { createPcsDatabaseConnection } from '../../src/infrastructure/persistence/database';
import {
  cleanupExpiredRateLimitBuckets,
  consumeFixedWindowRateLimit,
  hashRateLimitBucket
} from '../../src/infrastructure/persistence/rateLimitRepository';
import { rateLimitBuckets } from '../../src/infrastructure/persistence/securitySchema';

test('DB-backed fixed-window limiter never stores raw principals and resets on the next window', async () => {
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, 'DATABASE_URL is required');
  const connection = createPcsDatabaseConnection(databaseUrl);

  const secret = 'integration-rate-limit-secret-0123456789abcdef';
  const principal = 'ip:203.0.113.25';
  const scope = 'test-rate-limit';
  const firstWindow = new Date('2026-08-27T00:00:10.000Z');

  try {
    const first = await consumeFixedWindowRateLimit(connection.db, {
      secret,
      scope,
      principal,
      windowSeconds: 60,
      maxRequests: 2,
      now: firstWindow
    });
    assert.equal(first.allowed, true);
    assert.equal(first.requestCount, 1);
    assert.equal(first.remaining, 1);

    const second = await consumeFixedWindowRateLimit(connection.db, {
      secret,
      scope,
      principal,
      windowSeconds: 60,
      maxRequests: 2,
      now: new Date('2026-08-27T00:00:20.000Z')
    });
    assert.equal(second.allowed, true);
    assert.equal(second.requestCount, 2);
    assert.equal(second.remaining, 0);

    const third = await consumeFixedWindowRateLimit(connection.db, {
      secret,
      scope,
      principal,
      windowSeconds: 60,
      maxRequests: 2,
      now: new Date('2026-08-27T00:00:30.000Z')
    });
    assert.equal(third.allowed, false);
    assert.equal(third.requestCount, 3);
    assert.equal(third.remaining, 0);
    assert.ok(third.retryAfterSeconds > 0);

    const hash = hashRateLimitBucket({
      secret,
      scope,
      principal,
      windowStartMs: Date.parse('2026-08-27T00:00:00.000Z')
    });
    assert.match(hash, /^[a-f0-9]{64}$/);

    const stored = await connection.db
      .select()
      .from(rateLimitBuckets)
      .where(eq(rateLimitBuckets.bucketHash, hash));
    assert.equal(stored.length, 1);
    assert.equal(stored[0]?.requestCount, 3);
    assert.equal(JSON.stringify(stored[0]).includes(principal), false);
    assert.equal(JSON.stringify(stored[0]).includes('203.0.113.25'), false);

    const nextWindow = await consumeFixedWindowRateLimit(connection.db, {
      secret,
      scope,
      principal,
      windowSeconds: 60,
      maxRequests: 2,
      now: new Date('2026-08-27T00:01:05.000Z')
    });
    assert.equal(nextWindow.allowed, true);
    assert.equal(nextWindow.requestCount, 1);

    const deleted = await cleanupExpiredRateLimitBuckets(
      connection.db,
      new Date('2026-08-27T00:02:01.000Z')
    );
    assert.ok(deleted >= 1);

    const firstBucketAfterCleanup = await connection.db
      .select({ bucketHash: rateLimitBuckets.bucketHash })
      .from(rateLimitBuckets)
      .where(eq(rateLimitBuckets.bucketHash, hash));
    assert.equal(firstBucketAfterCleanup.length, 0);
  } finally {
    await connection.close();
  }
});
