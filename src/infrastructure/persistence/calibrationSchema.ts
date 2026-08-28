import { sql } from 'drizzle-orm';
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from 'drizzle-orm/pg-core';
import { anonymousSessions, assessmentModelReleases } from './schema';

const createdAt = () =>
  timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow();

export const calibrationConsentReceipts = pgTable(
  'calibration_consent_receipts',
  {
    consentReceiptId: uuid('consent_receipt_id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => anonymousSessions.sessionId, { onDelete: 'cascade' }),
    assessmentModelVersion: text('assessment_model_version')
      .notNull()
      .references(() => assessmentModelReleases.modelVersion, { onDelete: 'restrict' }),
    consentVersion: text('consent_version').notNull(),
    purposeId: text('purpose_id').notNull(),
    locale: text('locale').notNull(),
    status: text('status').notNull().default('granted'),
    grantedAt: timestamp('granted_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    withdrawnAt: timestamp('withdrawn_at', { withTimezone: true, mode: 'date' }),
    createdAt: createdAt(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex('calibration_consent_receipts_session_purpose_uq').on(table.sessionId, table.purposeId),
    index('calibration_consent_receipts_model_created_idx').on(table.assessmentModelVersion, table.createdAt),
    check('calibration_consent_receipt_status_chk', sql`${table.status} in ('granted','withdrawn')`),
    check(
      'calibration_consent_receipt_consent_version_chk',
      sql`${table.consentVersion} ~ '^[a-z0-9][a-z0-9._-]{2,119}$'`
    ),
    check(
      'calibration_consent_receipt_purpose_id_chk',
      sql`${table.purposeId} ~ '^[a-z0-9][a-z0-9._-]{2,119}$'`
    ),
    check(
      'calibration_consent_receipt_withdrawal_chk',
      sql`(
        (${table.status} = 'granted' and ${table.withdrawnAt} is null)
        or
        (${table.status} = 'withdrawn' and ${table.withdrawnAt} is not null and ${table.withdrawnAt} >= ${table.grantedAt})
      )`
    )
  ]
);
