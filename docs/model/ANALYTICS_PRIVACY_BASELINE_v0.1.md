# First-Party Analytics Privacy Baseline v0.1

> Status: Phase 4B development baseline; cleanup implementation exists, while production scheduling and legal/consent remain release gates.
> Date: 2026-08-27
> Event dictionary: `analytics-events-v0.1-dev`

## Purpose

PCS product analytics measures whether the web flow works and where users leave the funnel. It is not a diagnostic dataset and must never become a second copy of the assessment.

## Transport boundary

- Product events are sent only to the PCS first-party `/api/analytics` endpoint.
- The shipped application has no third-party analytics SDK/export enabled by default.
- Client requests cannot choose the event source; the endpoint fixes it to `client`.
- Server events are produced only by PCS server code.
- Event names and properties are allowlisted by the versioned event dictionary.
- Session-bound modelVersion/locale are derived from the authenticated anonymous session where defined; client-provided mismatches are rejected.

## Prohibited analytics data

The analytics pipeline must not persist or export:

- raw answer values or answer arrays;
- Trait Scores/vector or score basis points;
- Core/Extended diagnostic payload objects beyond a separately reviewed aggregate use case;
- Response Quality or Interaction internals;
- result prose/free text;
- private/public capability tokens;
- email, real name or precise location.

The application validator and PostgreSQL CHECK constraint independently enforce the current prohibited-key baseline.

## Current funnel events

The development dictionary covers:

- landing view;
- assessment start/resume;
- question view by position;
- answer interaction state (`selected` / `changed`) without the answer value;
- assessment completion;
- result view;
- share initiation/method/snapshot creation;
- public share view;
- bounded client/server error category;
- bucketed Web Vital measurement.

## Identity and linkage

- Session-bound events may store the internal anonymous `session_id` FK.
- The browser bearer token and its hash are not analytics properties.
- Events with `session_scope=none` have no diagnostic-session link.
- Deleting an anonymous session cascades deletion to its linked product events.
- Public-share views are intentionally not linked back to the private assessment session.

## Retention target

The retention policy is machine-readable at `data/analytics/retention-policy-v0.1-dev.json`. Repository cleanup and an explicit dry-run/execute CLI are implemented and CI-tested. Automated production scheduling is not yet configured.

| Class | Target maximum | Notes |
| --- | ---: | --- |
| Session-bound product events (`session_id IS NOT NULL`) | 90 days | Delete earlier when the owning anonymous session is deleted. |
| Unscoped product events (`session_id IS NULL`) | 30 days | Includes landing/public-share events and optional events when no assessment session is attached. |
| Error/performance events | Inherit 30/90-day linkage rule | No stack trace, message, raw timing value or Web Vitals ID in event properties. |
| Aggregated operational counters derived from expired events | TBD | Must be non-diagnostic and privacy-reviewed before indefinite retention. |

Current enforcement artifacts:

- `src/infrastructure/persistence/analyticsRetentionRepository.ts`;
- `scripts/cleanup-analytics-retention.mjs` (dry-run by default; `--execute` required to delete);
- CI retention dry-run plus PostgreSQL retention integration coverage.

Production scheduler configuration and deployment evidence remain release gates.

## Environment separation

Development/preview/production traffic must not be merged into one statistical population.

Preferred production design:

1. separate deployment environments;
2. separate databases or independently queryable schemas/datasets;
3. no client-controlled `environment` property used as the security boundary.

This remains dependent on `PCS-OPS-001`.

## Third-party export

`third_party_export_default=false` is an active invariant. Any future third-party analytics export requires:

- a new requirement/change record;
- explicit property mapping;
- proof that prohibited diagnostic data cannot cross the boundary;
- consent/legal review where required;
- environment and retention configuration review.

## Calibration is separate

Psychometric calibration datasets are not built from the product-events table. Calibration requires a separate consent/basis, extraction schema, retention rule and validation workflow.

## Release gaps

Before public launch:

- settle consent/legal basis and user-facing disclosure;
- configure and verify scheduled production execution of the implemented retention cleanup;
- prove development/preview/production separation;
- audit deployment/provider request logs independently from PCS event payloads;
- verify network payloads on real production-like builds;
- document any Core Type aggregate analytics decision separately.
