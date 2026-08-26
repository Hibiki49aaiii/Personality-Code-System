# ADR-0001 — PostgreSQL + Drizzle persistence

- Status: Accepted for Phase 2B
- Date: 2026-08-26
- Scope: PCS production persistence/model versioning

## Context

PCS needs relational persistence for immutable/versioned assessment models, anonymous progress, answers, and reproducible result snapshots. The diagnostic domain must remain framework- and database-independent.

## Decision

Use PostgreSQL as the production relational store with:

- `drizzle-orm` as the typed query/schema layer;
- `drizzle-kit` for schema-diff/generation support;
- `postgres` (Postgres.js) as the runtime driver;
- committed SQL migrations as the auditable production migration source;
- no ORM schema push against production.

The domain layer under `src/domain/assessment` must not import Drizzle, Postgres.js, or environment/database modules.

## Versioning and immutability

- Published assessment-model release rows become immutable once status is `published`.
- Result snapshots are insert-only from the application perspective. SQL prevents `UPDATE`; privacy/retention deletion remains possible.
- Historical model/item revisions are referenced, never silently rewritten.
- Result snapshots persist the exact assessment/item/scoring/code/interaction/content versions used.

## Anonymous session security

The browser receives a 256-bit random opaque bearer token. The database stores only its SHA-256 hash. The raw bearer token must not be persisted or logged server-side.

The session token contains no personality data, timestamps, model IDs, or sequential identifiers.

## Data representation

- Internal row IDs: UUID.
- Time: PostgreSQL `timestamptz`, application treats timestamps as UTC instants.
- Canonical Trait scores: integer basis points (`0..10000`).
- Result snapshot: versioned JSONB payload plus separately indexed version columns.
- Raw answers remain separate from result snapshots.

## Migration policy

1. Every production schema change is represented by a committed migration.
2. Preview/staging applies the migration before production.
3. Destructive migrations require explicit review and backup/recovery verification.
4. Published model rows must not be removed by cascading foreign keys.
5. Rollback normally means application rollback plus a forward corrective migration; destructive reverse SQL is not assumed safe.

## Rejected alternatives

### Prisma

Capable, but PCS benefits from a thinner SQL-near layer and explicit committed migration SQL for version/audit constraints.

### SQLite as production primary store

Useful for local prototypes but not selected as the production contract because PCS requires concurrent anonymous sessions, calibration queries, JSONB, and production-grade relational controls.

### Document database

Rejected as the primary store because model/item revisions, active mappings, answer ownership, and immutable version references are relational and benefit from foreign-key constraints.

## Consequences

- Infrastructure tests can validate token/session contracts without touching scoring logic.
- Database availability is not required to execute domain scoring tests.
- Production deployment will require `DATABASE_URL` only in server/infrastructure code.
