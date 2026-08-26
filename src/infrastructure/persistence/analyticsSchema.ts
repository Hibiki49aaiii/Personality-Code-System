import { sql } from 'drizzle-orm';
import { check, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { anonymousSessions } from './schema';

const createdAt = () => timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow();

export const productEvents = pgTable(
  'product_events',
  {
    eventId: uuid('event_id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id').references(() => anonymousSessions.sessionId, { onDelete: 'cascade' }),
    eventDictionaryVersion: text('event_dictionary_version').notNull(),
    eventName: text('event_name').notNull(),
    eventSource: text('event_source').notNull(),
    propertiesJson: jsonb('properties_json').$type<Record<string, string | number | boolean>>().notNull(),
    createdAt: createdAt()
  },
  (table) => [
    index('product_events_name_created_idx').on(table.eventName, table.createdAt),
    index('product_events_session_idx').on(table.sessionId),
    check('product_events_name_chk', sql`${table.eventName} ~ '^[a-z][a-z0-9_]{2,63}$'`),
    check('product_events_source_chk', sql`${table.eventSource} in ('client','server')`),
    check('product_events_properties_object_chk', sql`jsonb_typeof(${table.propertiesJson}) = 'object'`)
  ]
);
