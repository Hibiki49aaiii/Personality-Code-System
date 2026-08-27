# Data Minimization Specification v0.1

> Status: development privacy contract; public legal wording remains PCS-LEGAL-001.
> Inventory: `privacy-data-inventory-v0.1-dev`
> Date: 2026-08-27

## Purpose

PCS handles anonymous assessment answers and derived personality results. The implementation therefore uses an explicit allowlist model: data is stored only when a documented diagnosis, reproducibility, operation, security, or explicitly user-invoked sharing purpose requires it.

This specification is an engineering contract, not a Privacy Policy or legal opinion.

## Default collection boundary

The ordinary anonymous assessment does not request or require:

- account registration;
- real name;
- email address;
- telephone number;
- postal address;
- precise geolocation;
- employer;
- health history;
- political or religious identity;
- sexual data;
- biometric/camera/microphone media.

Adding any of those capabilities requires an explicit requirement/change record and, where applicable, separate consent/legal review. The privacy validator detects common browser collection capabilities such as email/telephone form inputs, geolocation, media capture, and contact access.

## Database inventory rule

Every PostgreSQL table MUST appear exactly once in `data/privacy/data-inventory-v0.1-dev.json`.

For every table/data class the inventory records at least:

1. purpose;
2. whether it contains or may contain personal data;
3. retention basis/window;
4. public-by-default status;
5. third-party-export default;
6. explicit-share status where applicable.

A migration that creates a new table without updating the privacy inventory fails CI.

## Current classes

### Versioned product definition

Trait/item/model/content/illustration definitions exist to make deterministic historical results reproducible. They are not one user's personality record and may be retained while referenced.

### Anonymous session operational state

The anonymous session exists only to bind browser writes/resume/result access to an opaque capability. The raw capability is not stored in PostgreSQL.

### Anonymous diagnostic answers

Raw 1–5 answers are required to compute the diagnosis. They remain private and are not copied into public share snapshots or product analytics.

### Derived private diagnostic result

Trait scores and immutable result snapshots exist to display and reproduce the result against the exact historical versions used at completion.

### Explicit public share

A public share is a separate sanitized snapshot created only after an explicit user action. It is not a public view over the private result.

### First-party product analytics

Product analytics contains only allowlisted funnel/coarse error/performance fields. Raw answer values, Trait vectors, Extended Code, result prose, capability tokens, and free-form errors are prohibited.

### Security abuse prevention

Rate-limit buckets store HMAC-derived principals rather than raw IP addresses or session credentials and expire after short fixed windows.

## Purpose limitation

A field/table collected for one class MUST NOT silently become an input to another purpose. In particular:

- product analytics is not a calibration dataset;
- public sharing is not implied by completion;
- public-share views are not linked back to the private diagnostic session;
- rate-limit HMACs are not user identifiers for analytics;
- raw answers are not exported to ordinary third parties;
- calibration export remains disabled until its separate consent/governance gate is implemented.

## Retention

Engineering retention targets are versioned separately in:

- `docs/model/PERSISTENCE_RETENTION_BASELINE_v0.1.md`;
- `data/analytics/retention-policy-v0.1-dev.json`.

Those engineering defaults are not final public legal promises. PCS-LEGAL-001 must reconcile public wording with the deployed retention/backup/deletion implementation before launch.

## Change gate

A future feature that changes collected data MUST update, in the same change set where applicable:

1. Master/derivative requirement IDs;
2. privacy data inventory;
3. persistence schema/migration;
4. retention policy;
5. analytics/share allowlists;
6. user-facing disclosure/consent requirement;
7. tests and traceability evidence.

No feature may bypass this process merely because a field is technically easy to collect.

## Automated evidence

`npm run validate:privacy-data` verifies:

- all migration-created tables are inventoried exactly once;
- all classes have a documented purpose and retention rule;
- no DB-backed class is public by default;
- third-party export remains disabled by default;
- direct identity/precise-location collection remains disabled;
- common browser identity/location/media collection capabilities are absent from the normal app/server source.

The validator complements, but does not replace, human legal/privacy review of production behavior.
