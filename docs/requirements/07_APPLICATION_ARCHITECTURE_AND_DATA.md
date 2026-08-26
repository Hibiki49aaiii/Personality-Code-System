# 07 — Application Architecture and Data Requirements

## Architectural principle

Diagnostic truth lives in a framework-independent domain layer. Next.js/React is the delivery layer, not the scoring specification. PostgreSQL/Drizzle are infrastructure dependencies and MUST NOT enter `src/domain/assessment`.

## Code boundaries

Current logical layers:

- `src/domain/assessment` — item/model/scoring/code/interaction/result logic; pure and database-independent.
- `src/infrastructure/persistence` — PostgreSQL/Drizzle schema, connection, anonymous-session credential and persistence adapter.
- `data/*` — versioned model/rule/content development artifacts.
- `app` — routes/rendering; real persistence wiring remains Phase 2C.

Dependency direction MUST keep domain logic independent from React components, database adapters and external services.

## Runtime architecture

- Next.js App Router + TypeScript remains the web foundation.
- Production code MUST use strict typing for diagnostic/result schemas.
- Server/client boundaries SHOULD minimize client JavaScript.
- External network dependencies MUST NOT be required for scoring/result composition except first-party persistence as explicitly designed.
- No AI/LLM SDK or generative API is a required runtime dependency.

## Persistence technology — PCS-ARCH-002 / PCS-ARCH-005

ADR: `docs/adr/ADR-0001-persistence-postgresql-drizzle.md`.

Selected stack:

- PostgreSQL;
- `drizzle-orm` typed schema/query layer;
- `postgres` (Postgres.js) driver;
- `drizzle-kit` for schema tooling;
- committed forward SQL migrations as production audit source;
- no production `schema push` workflow.

Current migration chain:

1. `drizzle/0000_phase2b_persistence.sql` — base tables, constraints and initial immutability triggers;
2. `drizzle/0001_phase2b_immutability_hardening.sql` — published model/content child protection, immutable revisions, model-bound answers/scores, snapshot coherence and completion freeze.

CI starts a real PostgreSQL 16 service, applies the ordered migration chain and verifies database behavior before running the rest of the suite.

## Persistence model

The current schema supports:

- Trait definitions + immutable dictionary revisions;
- assessment items + immutable item revisions;
- assessment model releases;
- model→item/revision/scoring mappings;
- content versions/modules;
- illustration asset references for the later curated asset system;
- anonymous sessions;
- answers;
- canonical Trait scores;
- immutable result snapshots;
- exact model/item/scoring/code/interaction/content version references.

Optional user/account linkage and calibration datasets are intentionally not introduced yet.

## Published-data immutability — PCS-ARCH-004

Database-level guards, not application convention alone, enforce:

- a published `assessment_model_releases` row cannot be updated or deleted;
- model-item mappings belonging to a published model cannot be inserted, updated or deleted;
- versioned Trait/item revision rows cannot be updated/deleted; a new revision must be created;
- a published content-version row cannot be updated/deleted;
- modules under a published content version cannot be inserted/updated/deleted;
- a result snapshot cannot be updated;
- retention/privacy deletion of a result snapshot remains allowed.

`immutable` means “not silently mutated while retained”, not “legally impossible to delete”.

## Anonymous session behavior

Production-style credential contract is implemented in `src/infrastructure/persistence/sessionToken.ts` and `anonymousAssessmentRepository.ts`:

- generate 32 random bytes (256 bits);
- encode as an opaque base64url bearer token;
- return the raw token only to the caller/browser boundary;
- store only SHA-256 hex in `anonymous_sessions.access_token_hash`;
- token contains no personality data, timestamp, model ID or sequential identifier;
- token hash lookup is unique;
- writable operations require `in_progress` and non-expired session state;
- completed sessions reject further answer/score/session mutation at DB and adapter layers.

The real HTTP/cookie transport is Phase 2C and MUST use secure server-side handling.

## Answer/model integrity

Database triggers ensure an answer:

- belongs to the exact assessment model of the session;
- uses the model's item revision and locale;
- can change only while the session is `in_progress`;
- remains within the 1..5 database constraint.

Trait score persistence likewise requires:

- Trait represented by the session model;
- scoring version equal to the model release;
- canonical `score_bp` within 0..10000;
- writable session state.

Application-side validation is still required for useful errors; database guards are the final integrity boundary.

## Result snapshot integrity

`result_snapshots` stores:

- typed/versioned JSONB snapshot;
- separately indexed assessment/item/scoring/code/interaction/content/locale metadata;
- session ownership.

Before insert, PostgreSQL verifies:

- snapshot model/version/locale columns equal the session's release metadata;
- embedded JSON version/locale metadata equals the indexed columns;
- snapshot is created while the session is still `in_progress`.

The persistence adapter writes Trait scores + snapshot + session-completion transition in one database transaction. Completion is rejected unless all required model answers, required Trait scores and the immutable snapshot exist.

## Private result retrieval

`getPrivateResultByAnonymousToken` resolves a completed private result by hashing the opaque bearer token server-side. It returns the sanitized result snapshot rather than raw answers.

This is **not** a public share URL. Public share IDs and share snapshots remain Phase 4 and require explicit user action.

## Public result links

A later public/shareable result identifier MUST:

- be opaque and non-sequential;
- reveal no raw answers;
- not be guessable at practical scale;
- map to a sanitized immutable share/result snapshot, not a live re-score of mutable current content;
- be created/activated only after explicit share/save action.

Default private results MUST NOT be indexed publicly.

## IDs and versions

- Stable internal IDs are distinct from display names.
- Published version identifiers are immutable.
- A result references exact model/code/content versions.
- Retired revisions remain resolvable for historical results.
- Internal row identifiers use UUID where appropriate.
- Canonical Trait scores use integer basis points.
- PostgreSQL timestamps are `timestamptz` and application code treats them as instants.

## Retention baseline

Engineering baseline: `docs/model/PERSISTENCE_RETENTION_BASELINE_v0.1.md`.

Current pre-legal defaults include:

- abandoned anonymous session/draft answers: 30 days;
- completed raw answers: 90 days;
- private derived result snapshot: 180 days;
- operational logs: 30 days;
- backups: 35 days;
- no calibration dataset by default without separate governance/consent basis.

These are engineering defaults, not final legal promises. Public launch requires reconciliation with real deployment and Privacy Policy.

## API/input validation

All externally supplied data MUST be validated server-side, including:

- model/version requested;
- item IDs/revisions;
- answer value range;
- answer count/completeness;
- session/share identifiers;
- locale;
- any account/profile mutation.

Client validation is UX only and never a security boundary.

## Migrations and rollback

- Every production schema change is a committed migration.
- Preview/staging applies migration before production.
- Destructive migrations require explicit review and backup/recovery verification.
- Published model data must not be removed by cascading model references.
- Rollback normally uses application rollback plus a forward corrective migration; destructive reverse SQL is not assumed safe.
- Migration structure and required invariants are statically checked by `scripts/validate-persistence-schema.mjs`.
- PostgreSQL integration tests prove the migration chain executes and the constraints/triggers behave as intended.

## Caching

Caching MAY be used for static type/content/result assets, but cache keys MUST include versions where stale content could alter result representation.

## Error handling

- Scoring/persistence integrity errors fail closed: do not fabricate a result.
- Unknown model/item/version must produce a controlled error.
- User-facing errors must not expose stack traces or internal IDs unnecessarily.
- Diagnostic computation failures must be observable without logging raw answers by default.

## Current requirement status

- **PCS-ARCH-001 — COMPLETE:** diagnostic domain is framework/database independent and separately tested.
- **PCS-ARCH-002 — COMPLETE as Phase 2B persistence foundation:** schema supports model versions, anonymous sessions, items/revisions, answers, scores, content/assets and result snapshots.
- **PCS-ARCH-003 — PARTIAL:** raw answers are separated from snapshots and adapter retrieval, but public URL/social-card implementation/audit is Phase 4.
- **PCS-ARCH-004 — COMPLETE for current persistence layer:** published model/content and result immutability are enforced by PostgreSQL and integration-tested.
- **PCS-ARCH-005 — COMPLETE as migration policy/foundation:** ADR, ordered committed migrations, validator, PostgreSQL CI and rollback approach exist; deployment-specific backup/recovery rehearsal remains release-operations work.
