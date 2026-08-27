import { sql } from 'drizzle-orm';
import {
  boolean,
  char,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from 'drizzle-orm/pg-core';
import type { ResultSnapshot } from '../../domain/assessment/resultSnapshot';

const createdAt = () => timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow();

export const traitDefinitions = pgTable('trait_definitions', {
  traitId: text('trait_id').primaryKey(),
  createdAt: createdAt()
});

export const traitDefinitionRevisions = pgTable(
  'trait_definition_revisions',
  {
    traitId: text('trait_id').notNull().references(() => traitDefinitions.traitId, { onDelete: 'restrict' }),
    dictionaryVersion: text('dictionary_version').notNull(),
    locale: text('locale').notNull(),
    displayName: text('display_name').notNull(),
    definition: text('definition').notNull(),
    createdAt: createdAt()
  },
  (table) => [primaryKey({ columns: [table.traitId, table.dictionaryVersion, table.locale] })]
);

export const assessmentItems = pgTable('assessment_items', {
  itemId: text('item_id').primaryKey(),
  primaryTraitId: text('primary_trait_id').notNull().references(() => traitDefinitions.traitId, { onDelete: 'restrict' }),
  createdAt: createdAt()
});

export const assessmentItemRevisions = pgTable(
  'assessment_item_revisions',
  {
    itemId: text('item_id').notNull().references(() => assessmentItems.itemId, { onDelete: 'restrict' }),
    revision: text('revision').notNull(),
    locale: text('locale').notNull(),
    text: text('text').notNull(),
    rationale: text('rationale').notNull(),
    lifecycleStatus: text('lifecycle_status').notNull(),
    introducedItemBankVersion: text('introduced_item_bank_version').notNull(),
    createdAt: createdAt()
  },
  (table) => [
    primaryKey({ columns: [table.itemId, table.revision, table.locale] }),
    check('assessment_item_revision_status_chk', sql`${table.lifecycleStatus} in ('draft','reviewed','beta','active','retired')`)
  ]
);

export const assessmentModelReleases = pgTable(
  'assessment_model_releases',
  {
    modelVersion: text('model_version').primaryKey(),
    status: text('status').notNull(),
    locale: text('locale').notNull(),
    traitDictionaryVersion: text('trait_dictionary_version').notNull(),
    itemBankVersion: text('item_bank_version').notNull(),
    scoringVersion: text('scoring_version').notNull(),
    codeSchemaVersion: text('code_schema_version').notNull(),
    interactionVersion: text('interaction_version').notNull(),
    contentVersion: text('content_version').notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true, mode: 'date' }),
    createdAt: createdAt()
  },
  (table) => [
    check('assessment_model_release_status_chk', sql`${table.status} in ('draft','beta','published','retired')`),
    check('assessment_model_publish_time_chk', sql`${table.status} <> 'published' or ${table.publishedAt} is not null`)
  ]
);

export const assessmentModelItems = pgTable(
  'assessment_model_items',
  {
    modelVersion: text('model_version').notNull().references(() => assessmentModelReleases.modelVersion, { onDelete: 'restrict' }),
    position: integer('position').notNull(),
    itemId: text('item_id').notNull(),
    itemRevision: text('item_revision').notNull(),
    locale: text('locale').notNull(),
    traitId: text('trait_id').notNull().references(() => traitDefinitions.traitId, { onDelete: 'restrict' }),
    direction: integer('direction').notNull(),
    weightMilli: integer('weight_milli').notNull(),
    required: boolean('required').notNull().default(true)
  },
  (table) => [
    primaryKey({ columns: [table.modelVersion, table.position] }),
    uniqueIndex('assessment_model_items_identity_uq').on(table.modelVersion, table.itemId),
    foreignKey({
      columns: [table.itemId, table.itemRevision, table.locale],
      foreignColumns: [assessmentItemRevisions.itemId, assessmentItemRevisions.revision, assessmentItemRevisions.locale]
    }).onDelete('restrict'),
    check('assessment_model_items_position_chk', sql`${table.position} > 0`),
    check('assessment_model_items_direction_chk', sql`${table.direction} in (-1,1)`),
    check('assessment_model_items_weight_chk', sql`${table.weightMilli} > 0`)
  ]
);

export const contentVersions = pgTable('content_versions', {
  contentVersion: text('content_version').primaryKey(),
  locale: text('locale').notNull(),
  status: text('status').notNull(),
  createdAt: createdAt()
}, (table) => [
  check('content_version_status_chk', sql`${table.status} in ('draft','beta','published','retired')`)
]);

export const contentModules = pgTable(
  'content_modules',
  {
    contentVersion: text('content_version').notNull().references(() => contentVersions.contentVersion, { onDelete: 'restrict' }),
    moduleId: text('module_id').notNull(),
    domain: text('domain').notNull(),
    priority: integer('priority').notNull(),
    moduleJson: jsonb('module_json').notNull(),
    createdAt: createdAt()
  },
  (table) => [primaryKey({ columns: [table.contentVersion, table.moduleId] })]
);

export const illustrationAssets = pgTable('illustration_assets', {
  assetVersion: text('asset_version').primaryKey(),
  assetKey: text('asset_key').notNull(),
  storageRef: text('storage_ref').notNull(),
  metadataJson: jsonb('metadata_json').notNull(),
  createdAt: createdAt()
});

export const anonymousSessions = pgTable(
  'anonymous_sessions',
  {
    sessionId: uuid('session_id').primaryKey().defaultRandom(),
    accessTokenHash: char('access_token_hash', { length: 64 }).notNull(),
    modelVersion: text('model_version').notNull().references(() => assessmentModelReleases.modelVersion, { onDelete: 'restrict' }),
    locale: text('locale').notNull(),
    status: text('status').notNull().default('in_progress'),
    createdAt: createdAt(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' })
  },
  (table) => [
    uniqueIndex('anonymous_sessions_access_token_hash_uq').on(table.accessTokenHash),
    index('anonymous_sessions_expiry_idx').on(table.expiresAt),
    check('anonymous_session_status_chk', sql`${table.status} in ('in_progress','completed','expired')`),
    check('anonymous_session_completion_chk', sql`${table.status} <> 'completed' or ${table.completedAt} is not null`)
  ]
);

export const assessmentAnswers = pgTable(
  'assessment_answers',
  {
    sessionId: uuid('session_id').notNull().references(() => anonymousSessions.sessionId, { onDelete: 'cascade' }),
    itemId: text('item_id').notNull(),
    itemRevision: text('item_revision').notNull(),
    locale: text('locale').notNull(),
    value: integer('value').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
  },
  (table) => [
    primaryKey({ columns: [table.sessionId, table.itemId] }),
    foreignKey({
      columns: [table.itemId, table.itemRevision, table.locale],
      foreignColumns: [assessmentItemRevisions.itemId, assessmentItemRevisions.revision, assessmentItemRevisions.locale]
    }).onDelete('restrict'),
    check('assessment_answer_value_chk', sql`${table.value} between 1 and 5`)
  ]
);

export const assessmentTraitScores = pgTable(
  'assessment_trait_scores',
  {
    sessionId: uuid('session_id').notNull().references(() => anonymousSessions.sessionId, { onDelete: 'cascade' }),
    traitId: text('trait_id').notNull().references(() => traitDefinitions.traitId, { onDelete: 'restrict' }),
    scoringVersion: text('scoring_version').notNull(),
    scoreBp: integer('score_bp').notNull(),
    createdAt: createdAt()
  },
  (table) => [
    primaryKey({ columns: [table.sessionId, table.traitId] }),
    check('assessment_trait_score_bp_chk', sql`${table.scoreBp} between 0 and 10000`)
  ]
);

export const resultSnapshots = pgTable(
  'result_snapshots',
  {
    snapshotId: uuid('snapshot_id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id').notNull().references(() => anonymousSessions.sessionId, { onDelete: 'cascade' }),
    snapshotSchemaVersion: text('snapshot_schema_version').notNull(),
    assessmentModelVersion: text('assessment_model_version').notNull().references(() => assessmentModelReleases.modelVersion, { onDelete: 'restrict' }),
    itemBankVersion: text('item_bank_version').notNull(),
    scoringVersion: text('scoring_version').notNull(),
    codeSchemaVersion: text('code_schema_version').notNull(),
    interactionVersion: text('interaction_version').notNull(),
    contentVersion: text('content_version').notNull().references(() => contentVersions.contentVersion, { onDelete: 'restrict' }),
    locale: text('locale').notNull(),
    snapshotJson: jsonb('snapshot_json').$type<ResultSnapshot>().notNull(),
    createdAt: createdAt()
  },
  (table) => [
    uniqueIndex('result_snapshots_session_uq').on(table.sessionId),
    index('result_snapshots_model_idx').on(table.assessmentModelVersion),
    index('result_snapshots_created_at_idx').on(table.createdAt)
  ]
);
