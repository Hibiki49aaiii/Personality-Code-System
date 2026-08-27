# 09 — Social Sharing and Analytics Requirements

## Sharing principle

Sharing is a deliberate export of a sanitized result identity, not automatic publication of assessment data.

## Share methods

Initial supported methods SHOULD include:

- Web Share API where supported;
- X share intent;
- LINE share intent;
- copy result URL;
- downloadable/shareable portrait result image where implementation allows;
- Open Graph metadata/image for explicit public share URLs.

No social-account OAuth is required for MVP sharing.

## Share snapshot

A shareable result MUST be derived from an immutable sanitized result snapshot and MAY include:

- Personality Code;
- Core Type name;
- one identity sentence;
- selected headline traits/categories;
- observed rarity/sample statistic only when policy permits;
- curated type illustration;
- PCS brand/service mark;
- model/version indication when visually practical.

It MUST NOT include:

- raw item answers;
- session token;
- email/account identifier;
- confidence internals that could be misread as deception score;
- sensitive analytics identifiers.

## Share creation flow

- User finishes result privately.
- User explicitly selects share/save-public action.
- Server creates or activates an opaque public snapshot ID.
- Share UI uses that URL/snapshot.
- Reopening the URL MUST not re-score against the newest model/content.

If public-link revocation is implemented, revoked links must stop serving the public snapshot after reasonable cache invalidation.

## Open Graph image

OG/social images MUST be deterministic for a given result snapshot + asset/template version.

Template requirements:

- stable dimensions suitable for major social previews;
- safe text margins;
- readable type/code at preview size;
- curated illustration only;
- fallback if illustration asset unavailable;
- Japanese glyph/font handling verified;
- no dependence on runtime AI/image generation.

## Portrait share image

The mobile/portrait card SHOULD be optimized for posting/saving to social platforms and SHOULD include enough identity to be understandable outside the site.

It must not become a screenshot of the entire long result page.

## Current Phase 4A development implementation

The current implementation separates private diagnostic persistence from public sharing:

- assessment completion remains private and creates no public URL;
- POST `/api/share` requires the existing private HttpOnly assessment cookie and performs the explicit export action;
- a fresh 256-bit base64url public capability token is returned to the browser while only its SHA-256 hash is stored;
- each public link owns an immutable `share-snapshot-v0.1-dev` sanitized JSON payload;
- the public payload contains Core Code, locale, exact assessment/code/content versions and sanitized presentation fields; new shares freeze the exact source illustration asset version while public name/identity remain nullable until public taxonomy approval;
- raw answers, Trait Scores/vector, Response Quality, Interaction internals, Extended Code, private session IDs/tokens and private section/module structures are excluded;
- PostgreSQL independently rejects prohibited fields and source/version mismatches;
- GET `/s/[token]` reads only the public sanitized snapshot and needs no private cookie;
- X, LINE, Web Share and copy controls all use the opaque public URL;
- the private result owner can revoke all active public links derived from that result;
- private-source deletion automatically revokes attached public links before detaching the source FK;
- deterministic development cards exist at versioned OG (1200×630) and portrait (1080×1350) routes and render the exact curated asset version stored in the sanitized share snapshot;
- the public page emits dynamic Open Graph/Twitter metadata referencing the sanitized versioned OG route;
- image generation is deterministic template rendering with `next/og`, not AI/model generation;
- public pages use `noindex` by default.

The display-name/identity fields remain nullable while C01D public taxonomy copy is unapproved. Illustration is no longer nullable for new completion/share flows: `ILL-PCS-FALLBACK-HERO-v01` is frozen first into `result-snapshot-v0.2-dev`, propagated into the sanitized share snapshot, and enforced by PostgreSQL so a share cannot substitute different artwork.

CI Run 190 is the historical sanitized-share baseline. Visual Baseline Run 9 freezes the curated-artwork result/public-share presentation, and full CI Run 432 proves the current 147-item flow, source/share asset lineage, explicit share creation, cookie-free public view, X/LINE/copy controls, byte-identical OG/portrait images, artwork-version headers and revocation/404 behavior. Type-specific hero production remains Phase 3B / PCS-ART-002.

## Current Phase 4B development implementation

The current product-analytics path is first-party only and versioned by `analytics-events-v0.1-dev`:

- browser events POST only to PCS `/api/analytics`; no third-party analytics SDK/export is enabled by default;
- client requests cannot choose `source`; the API fixes browser events to `client`;
- session-bound `modelVersion` and locale are derived/validated from the HttpOnly anonymous assessment session;
- server events cover assessment start/resume/completion, result view, share-snapshot creation and public-share view;
- client events cover landing view, question position, answer interaction state, share initiation and share method;
- `answer_interaction` records only item position plus `selected|changed`, never answer value;
- the event dictionary, TypeScript validator and PostgreSQL CHECK constraint independently prohibit raw answers, Trait vectors/scores, Extended Code, Response Quality, Interaction internals, free text and capability tokens;
- product analytics is best-effort and cannot make the assessment/share flow fail;
- session-bound product events cascade-delete with the owning anonymous session;
- public-share-view events are intentionally unlinked from the private diagnostic session.

CI Run `33036549731` (Run 238) verifies the complete browser funnel and inspects both the actual `/api/analytics` network payloads and persisted `product_events` rows. The browser never sends an answer value or client-supplied model version for answer/question telemetry.

Retention/privacy operating targets are documented in `docs/model/ANALYTICS_PRIVACY_BASELINE_v0.1.md`. Production cleanup enforcement, deployment-environment separation and legal/consent review remain release gates.

### Observed type-distribution foundation

PCS now has a non-public aggregation foundation defined by `observed-type-distribution-v0.1-dev`.

It:

- reads immutable completed `result_snapshots`, not product analytics events;
- requires exact assessment-model version, code-schema version, locale and time range;
- exposes the denominator/sample size and eligibility rule;
- uses integer basis-point shares;
- sets `populationClaimAllowed=false`;
- never derives rarity from 64 theoretical combinations or Trait-probability multiplication.

The domain/repository implementation is covered by CI Run `33036572687` (Run 240). Public display remains blocked until the production code model, valid-assessment exclusion rule, minimum-sample/privacy threshold and final wording policy are approved.

Specification: `docs/model/OBSERVED_TYPE_DISTRIBUTION_SPEC_v0.1.md`.

### Retention, error and performance foundation

The development implementation now also includes:

- versioned retention policy `analytics-retention-v0.1-dev`;
- 30-day unscoped / 90-day session-bound product-event cleanup;
- earlier cascade deletion when an anonymous assessment session is deleted;
- `npm run cleanup:analytics` as a dry-run-first operational command, with `--execute` required to delete;
- fixed-enum `client_error` / `server_error` property contracts; free-form message/stack fields are not allowlisted;
- App Router and assessment/share client failure telemetry using only fixed category/surface values;
- Web Vitals reduced to metric name plus rating bucket; raw value/delta/id are discarded before transport;
- minimal `GET /api/health` PostgreSQL readiness response with no database URL, version or exception details.

Verification:

- CI Run `33037531921` (Run 269): fixed-category browser error telemetry;
- CI Run `33037562880` (Run 270): retention policy, PostgreSQL cleanup integration and CLI dry-run;
- CI Run `33037608636` (Run 272): minimal readiness endpoint;
- CI Run `33037683667` (Run 273): API rejects raw Web Vital values/IDs and free-form error message/stack payloads.

Production scheduling, independently durable monitoring/alerting and environment separation remain operations gates.

### Calibration export gate

Calibration is still deliberately separate from ordinary analytics. `docs/model/CALIBRATION_EXPORT_SPEC_v0.1.md` defines the future consent/governance prerequisites. No raw-answer calibration export endpoint/job is shipped before those prerequisites exist.

## Analytics events

Initial first-party/product events:

- landing viewed;
- assessment started;
- question viewed (position/item opaque internal ID where appropriate);
- answer interaction count/state without exporting answer value to third-party analytics;
- assessment resumed;
- assessment completed;
- result viewed;
- result domain expanded/viewed if used;
- share initiated;
- share method selected;
- share snapshot created;
- client/server error category;
- performance measurements.

## Analytics payload rules

Third-party analytics SHOULD receive the minimum properties needed for funnel/product analysis.

Do not send by default:

- raw answer value;
- complete trait vector;
- detailed result prose;
- free-form user input;
- directly identifying diagnostic payload.

If a Core Type is ever used as an analytics dimension, privacy impact must be reviewed first and aggregation thresholds should be considered.

## Calibration telemetry

Psychometric calibration is not ordinary analytics.

A first-party calibration pipeline MAY store:

- anonymized/pseudonymous answer sets;
- model/item versions;
- response timings needed for quality analysis;
- retest linkage via privacy-preserving mechanism;
- optional separately consented demographics.

Calibration exports MUST remove unnecessary operational/account identifiers.

## Rarity statistics

Displayed rarity/distribution MUST be computed from valid stored assessments under an explicit scope.

Every statistic MUST carry enough metadata to produce wording such as:

> “1.7% of 128,420 valid Japanese PCS v1.0 assessments completed from DATE to DATE.”

Prohibited:

- “only 0.1% of humanity” based solely on theoretical trait multiplication;
- silently mixing incompatible model versions;
- hiding sample size when presenting precise percentages;
- using invalid/abandoned assessments in the denominator.

## Analytics acceptance checklist

- [x] event dictionary documented;
- [x] no raw answers visible in analytics network payloads; third-party export is disabled by default and first-party browser payloads are E2E-audited;
- [ ] consent behavior matches legal/privacy implementation;
- [ ] staging/test traffic separable from production;
- [x] model version attached server-side to session-bound assessment funnel events where defined; calibration remains a separate blocked path;
- [x] retention targets documented; production cleanup enforcement remains an operations/release gate;
- [x] share funnel test passes without social login. *(Development share flow is browser-tested; final curated-art card remains separate.)*
