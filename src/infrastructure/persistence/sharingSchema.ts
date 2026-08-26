import { sql } from 'drizzle-orm';
import {
  char,
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from 'drizzle-orm/pg-core';
import type { ShareSnapshotV01 } from '../../domain/sharing/shareSnapshot';
import { assessmentModelReleases, contentVersions, resultSnapshots } from './schema';

const createdAt = () => timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow();

export const publicShareSnapshots = pgTable(
  'public_share_snapshots',
  {
    shareSnapshotId: uuid('share_snapshot_id').primaryKey().defaultRandom(),
    publicTokenHash: char('public_token_hash', { length: 64 }).notNull(),
    sourceResultSnapshotId: uuid('source_result_snapshot_id').references(() => resultSnapshots.snapshotId, {
      onDelete: 'set null'
    }),
    shareSchemaVersion: text('share_schema_version').notNull(),
    assessmentModelVersion: text('assessment_model_version').notNull().references(() => assessmentModelReleases.modelVersion, {
      onDelete: 'restrict'
    }),
    codeSchemaVersion: text('code_schema_version').notNull(),
    contentVersion: text('content_version').notNull().references(() => contentVersions.contentVersion, {
      onDelete: 'restrict'
    }),
    locale: text('locale').notNull(),
    status: text('status').notNull().default('active'),
    shareJson: jsonb('share_json').$type<ShareSnapshotV01>().notNull(),
    createdAt: createdAt(),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'date' }),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' })
  },
  (table) => [
    uniqueIndex('public_share_snapshots_token_hash_uq').on(table.publicTokenHash),
    index('public_share_snapshots_source_idx').on(table.sourceResultSnapshotId),
    index('public_share_snapshots_created_at_idx').on(table.createdAt),
    index('public_share_snapshots_expiry_idx').on(table.expiresAt),
    check('public_share_snapshot_status_chk', sql`${table.status} in ('active','revoked','expired')`),
    check('public_share_snapshot_revocation_chk', sql`${table.status} <> 'revoked' or ${table.revokedAt} is not null`)
  ]
);
