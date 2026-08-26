# 07 — Application Architecture and Data Requirements

## Architectural principle

Diagnostic truth must live in a framework-independent domain layer. Next.js/React is the delivery layer, not the scoring specification.

## Code boundaries

Recommended logical layers:

- `domain/assessment` — item/model types, validation, completion rules.
- `domain/scoring` — pure scoring/normalization/confidence functions.
- `domain/codes` — Core/Extended Code generation.
- `domain/results` — deterministic module selection/result schema.
- `content` — versioned authored modules/type catalog metadata.
- `app` — routes, server actions/handlers, rendering.
- `infrastructure` — persistence, analytics, storage, monitoring.

Exact folders may evolve, but dependency direction MUST keep domain logic independent from React components and external services.

## Runtime architecture

- Next.js App Router + TypeScript remains the current web foundation.
- Production code MUST use strict typing for diagnostic/result schemas.
- Server/client boundaries SHOULD minimize client JavaScript.
- External network dependencies MUST NOT be required for scoring/result composition except first-party persistence as explicitly designed.
- No AI/LLM SDK or generative API is a required runtime dependency.

## Persistence model

The production schema MUST support at least:

- assessment models;
- trait definitions;
- assessment items and revisions;
- active model-item mappings/scoring keys;
- anonymous sessions;
- answer sets;
- computed trait scores;
- code schemas/types;
- result snapshots;
- content versions/modules;
- illustration/share asset references;
- optional user/account linkage if introduced later;
- calibration/reliability metadata with appropriate privacy controls.

## IDs and versions

- Stable internal IDs MUST be distinct from display names.
- Published version identifiers MUST be immutable.
- A result MUST reference the exact model/code/content versions used.
- Retired items/types remain resolvable for historical results.

## Anonymous session behavior

- Use high-entropy opaque session identifiers.
- Session identifier MUST reveal no personality data.
- Client-side storage MAY cache non-sensitive progress identifiers/answers, but server persistence rules must be explicit.
- Expiration/retention MUST be defined.
- Abandoned session cleanup MUST not delete data required for approved aggregate calibration unless retention/consent policy says otherwise.

## Public result links

A public/shareable result identifier MUST:

- be opaque and non-sequential;
- reveal no raw answers;
- not be guessable at practical scale;
- map to a sanitized result snapshot, not a live re-score of mutable current content;
- be created/activated only after explicit share/save action.

Default private results MUST NOT be indexed publicly.

## API/input validation

All externally supplied data MUST be validated server-side, including:

- model/version requested;
- item IDs;
- answer value range;
- answer count/completeness;
- session/share identifiers;
- locale;
- any account/profile mutation.

Client validation is UX only and never a security boundary.

## Database technology

PostgreSQL is the preferred initial relational store. ORM/query-layer choice (Drizzle/Prisma/etc.) is an implementation ADR and MUST NOT compromise version immutability or migration auditability.

## Migrations

Before production persistence:

- migration tool/process selected;
- forward migration tested in preview/staging;
- destructive migrations reviewed separately;
- rollback/data recovery procedure documented;
- published model data protected from accidental cascading deletion.

## Caching

Caching MAY be used for static type/content/result assets, but cache keys MUST include versions where stale content could alter result representation.

## Error handling

- Scoring errors fail closed: do not fabricate a result.
- Unknown model/item/version must produce a controlled error.
- User-facing errors must not expose stack traces or internal IDs unnecessarily.
- Diagnostic computation failures must be observable in monitoring without logging raw answers by default.
