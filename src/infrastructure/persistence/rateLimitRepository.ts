import { createHmac } from 'node:crypto';
import { lt, sql } from 'drizzle-orm';
import type { PcsDatabase } from './database';
import { rateLimitBuckets } from './securitySchema';

export interface RateLimitDecision {
  allowed: boolean;
  requestCount: number;
  maxRequests: number;
  remaining: number;
  retryAfterSeconds: number;
  windowStart: Date;
  windowEnd: Date;
}

export function hashRateLimitBucket(input: {
  secret: string;
  scope: string;
  principal: string;
  windowStartMs: number;
}): string {
  if (input.secret.length < 32) throw new Error('Rate limit secret must be at least 32 characters');
  if (!/^[a-z][a-z0-9-]{2,63}$/.test(input.scope)) throw new Error('Invalid rate limit scope');
  if (!input.principal || input.principal.length > 4096) throw new Error('Invalid rate limit principal');
  if (!Number.isSafeInteger(input.windowStartMs) || input.windowStartMs < 0) {
    throw new Error('Invalid rate limit window start');
  }

  return createHmac('sha256', input.secret)
    .update(input.scope)
    .update('\0')
    .update(String(input.windowStartMs))
    .update('\0')
    .update(input.principal)
    .digest('hex');
}

export async function consumeFixedWindowRateLimit(
  db: PcsDatabase,
  input: {
    secret: string;
    scope: string;
    principal: string;
    windowSeconds: number;
    maxRequests: number;
    now?: Date;
  }
): Promise<RateLimitDecision> {
  const now = input.now ?? new Date();
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new Error('Rate limit requires a valid now Date');
  }
  if (!Number.isSafeInteger(input.windowSeconds) || input.windowSeconds < 1 || input.windowSeconds > 86400) {
    throw new Error('windowSeconds must be an integer from 1 to 86400');
  }
  if (!Number.isSafeInteger(input.maxRequests) || input.maxRequests < 1 || input.maxRequests > 1_000_000) {
    throw new Error('maxRequests must be an integer from 1 to 1000000');
  }

  const windowMs = input.windowSeconds * 1000;
  const windowStartMs = Math.floor(now.getTime() / windowMs) * windowMs;
  const windowStart = new Date(windowStartMs);
  const windowEnd = new Date(windowStartMs + windowMs);
  const expiresAt = new Date(windowEnd.getTime() + windowMs);
  const bucketHash = hashRateLimitBucket({
    secret: input.secret,
    scope: input.scope,
    principal: input.principal,
    windowStartMs
  });

  const [row] = await db
    .insert(rateLimitBuckets)
    .values({
      bucketHash,
      scope: input.scope,
      windowStart,
      expiresAt,
      requestCount: 1,
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: rateLimitBuckets.bucketHash,
      set: {
        requestCount: sql`${rateLimitBuckets.requestCount} + 1`,
        updatedAt: now
      }
    })
    .returning({
      requestCount: rateLimitBuckets.requestCount
    });

  if (!row) throw new Error('Failed to consume rate limit bucket');

  const allowed = row.requestCount <= input.maxRequests;
  return {
    allowed,
    requestCount: row.requestCount,
    maxRequests: input.maxRequests,
    remaining: Math.max(0, input.maxRequests - row.requestCount),
    retryAfterSeconds: allowed
      ? 0
      : Math.max(1, Math.ceil((windowEnd.getTime() - now.getTime()) / 1000)),
    windowStart,
    windowEnd
  };
}

export async function cleanupExpiredRateLimitBuckets(
  db: PcsDatabase,
  now: Date = new Date()
): Promise<number> {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new Error('Rate limit cleanup requires a valid Date');
  }

  const deleted = await db
    .delete(rateLimitBuckets)
    .where(lt(rateLimitBuckets.expiresAt, now))
    .returning({ bucketHash: rateLimitBuckets.bucketHash });

  return deleted.length;
}
