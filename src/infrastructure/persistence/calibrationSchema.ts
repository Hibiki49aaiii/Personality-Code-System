import { sql } from 'drizzle-orm';
import {
  char,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
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


export const calibrationOperators = pgTable(
  'calibration_operators',
  {
    operatorId: uuid('operator_id').primaryKey().defaultRandom(),
    credentialHash: char('credential_hash', { length: 64 }).notNull(),
    status: text('status').notNull().default('active'),
    createdAt: createdAt(),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'date' })
  },
  (table) => [
    uniqueIndex('calibration_operators_credential_hash_uq').on(table.credentialHash),
    check('calibration_operator_credential_hash_chk', sql`${table.credentialHash} ~ '^[a-f0-9]{64}$'`),
    check('calibration_operator_status_chk', sql`${table.status} in ('active','revoked')`),
    check(
      'calibration_operator_revocation_chk',
      sql`(
        (${table.status} = 'active' and ${table.revokedAt} is null)
        or
        (${table.status} = 'revoked' and ${table.revokedAt} is not null)
      )`
    )
  ]
);

export const calibrationOperatorRoles = pgTable(
  'calibration_operator_roles',
  {
    operatorId: uuid('operator_id')
      .notNull()
      .references(() => calibrationOperators.operatorId, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    createdAt: createdAt()
  },
  (table) => [
    primaryKey({ columns: [table.operatorId, table.role] }),
    check(
      'calibration_operator_role_chk',
      sql`${table.role} in (
        'calibration-export-requester',
        'calibration-export-approver',
        'calibration-privacy-operator',
        'calibration-reviewer'
      )`
    )
  ]
);

export const calibrationExportRequests = pgTable(
  'calibration_export_requests',
  {
    requestId: uuid('request_id').primaryKey().defaultRandom(),
    requesterOperatorId: uuid('requester_operator_id')
      .notNull()
      .references(() => calibrationOperators.operatorId, { onDelete: 'restrict' }),
    approverOperatorId: uuid('approver_operator_id')
      .references(() => calibrationOperators.operatorId, { onDelete: 'restrict' }),
    purposeCode: text('purpose_code').notNull(),
    waveId: text('wave_id').notNull(),
    exportSchemaVersion: text('export_schema_version').notNull(),
    consentVersion: text('consent_version').notNull(),
    assessmentModelVersion: text('assessment_model_version')
      .notNull()
      .references(() => assessmentModelReleases.modelVersion, { onDelete: 'restrict' }),
    itemBankVersion: text('item_bank_version').notNull(),
    scoringVersion: text('scoring_version').notNull(),
    traitDictionaryVersion: text('trait_dictionary_version').notNull(),
    locale: text('locale').notNull(),
    status: text('status').notNull().default('requested'),
    requestedAt: createdAt(),
    decidedAt: timestamp('decided_at', { withTimezone: true, mode: 'date' })
  },
  (table) => [
    index('calibration_export_requests_status_requested_idx').on(table.status, table.requestedAt),
    check('calibration_export_request_purpose_chk', sql`${table.purposeCode} ~ '^[a-z][a-z0-9-]{2,63}$'`),
    check('calibration_export_request_status_chk', sql`${table.status} in ('requested','approved','rejected')`),
    check(
      'calibration_export_request_distinct_operators_chk',
      sql`${table.approverOperatorId} is null or ${table.approverOperatorId} <> ${table.requesterOperatorId}`
    ),
    check(
      'calibration_export_request_decision_chk',
      sql`(
        (${table.status} = 'requested' and ${table.approverOperatorId} is null and ${table.decidedAt} is null)
        or
        (${table.status} in ('approved','rejected') and ${table.approverOperatorId} is not null and ${table.decidedAt} is not null)
      )`
    )
  ]
);

export const calibrationOperatorAuditEvents = pgTable(
  'calibration_operator_audit_events',
  {
    auditEventId: uuid('audit_event_id').primaryKey().defaultRandom(),
    action: text('action').notNull(),
    requesterOperatorId: uuid('requester_operator_id')
      .notNull()
      .references(() => calibrationOperators.operatorId, { onDelete: 'restrict' }),
    approverOperatorId: uuid('approver_operator_id')
      .notNull()
      .references(() => calibrationOperators.operatorId, { onDelete: 'restrict' }),
    purposeCode: text('purpose_code').notNull(),
    waveId: text('wave_id').notNull(),
    exportSchemaVersion: text('export_schema_version').notNull(),
    consentVersion: text('consent_version').notNull(),
    assessmentModelVersion: text('assessment_model_version').notNull(),
    itemBankVersion: text('item_bank_version').notNull(),
    scoringVersion: text('scoring_version').notNull(),
    traitDictionaryVersion: text('trait_dictionary_version').notNull(),
    locale: text('locale').notNull(),
    rowCount: integer('row_count'),
    artifactSha256: char('artifact_sha256', { length: 64 }),
    disposition: text('disposition').notNull(),
    occurredAt: createdAt()
  },
  (table) => [
    index('calibration_operator_audit_events_occurred_idx').on(table.occurredAt),
    check(
      'calibration_operator_audit_action_chk',
      sql`${table.action} in ('export-approved','export-rejected','privacy-purge-requested','privacy-purge-confirmed')`
    ),
    check(
      'calibration_operator_audit_distinct_operators_chk',
      sql`${table.requesterOperatorId} <> ${table.approverOperatorId}`
    ),
    check('calibration_operator_audit_purpose_chk', sql`${table.purposeCode} ~ '^[a-z][a-z0-9-]{2,63}$'`),
    check('calibration_operator_audit_row_count_chk', sql`${table.rowCount} is null or ${table.rowCount} >= 0`),
    check(
      'calibration_operator_audit_artifact_hash_chk',
      sql`${table.artifactSha256} is null or ${table.artifactSha256} ~ '^[a-f0-9]{64}$'`
    ),
    check(
      'calibration_operator_audit_disposition_chk',
      sql`${table.disposition} in ('approved','rejected','purge-pending','purged')`
    )
  ]
);

export const calibrationRecordLinks = pgTable(
  'calibration_record_links',
  {
    calibrationRecordId: uuid('calibration_record_id').primaryKey().defaultRandom(),
    consentReceiptId: uuid('consent_receipt_id')
      .notNull()
      .unique()
      .references(() => calibrationConsentReceipts.consentReceiptId, { onDelete: 'cascade' }),
    createdAt: createdAt()
  }
);

export const calibrationDeletionEvents = pgTable(
  'calibration_deletion_events',
  {
    deletionEventId: uuid('deletion_event_id').primaryKey().defaultRandom(),
    calibrationRecordId: uuid('calibration_record_id').notNull(),
    reason: text('reason').notNull(),
    occurredAt: createdAt()
  },
  (table) => [
    uniqueIndex('calibration_deletion_events_record_reason_uq').on(table.calibrationRecordId, table.reason),
    index('calibration_deletion_events_occurred_idx').on(table.occurredAt),
    check(
      'calibration_deletion_event_reason_chk',
      sql`${table.reason} in ('consent-withdrawn','owner-session-deleted','privacy-operator-purge')`
    )
  ]
);
