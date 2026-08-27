import { sql } from 'drizzle-orm';
import { char, check, index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

const createdAt = () => timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow();

export const rateLimitBuckets = pgTable(
  'rate_limit_buckets',
  {
    bucketHash: char('bucket_hash', { length: 64 }).primaryKey(),
    scope: text('scope').notNull(),
    windowStart: timestamp('window_start', { withTimezone: true, mode: 'date' }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    requestCount: integer('request_count').notNull().default(1),
    createdAt: createdAt(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
  },
  (table) => [
    index('rate_limit_buckets_expires_idx').on(table.expiresAt),
    check('rate_limit_bucket_hash_chk', sql`${table.bucketHash} ~ '^[a-f0-9]{64}$'`),
    check('rate_limit_scope_chk', sql`${table.scope} ~ '^[a-z][a-z0-9-]{2,63}$'`),
    check('rate_limit_request_count_chk', sql`${table.requestCount} >= 1`),
    check('rate_limit_expiry_chk', sql`${table.expiresAt} > ${table.windowStart}`)
  ]
);
