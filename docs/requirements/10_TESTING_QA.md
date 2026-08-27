# 10 — Testing and QA Requirements

## QA principle

PCS correctness means more than “the page renders.” A release must verify diagnostic determinism, historical reproducibility, responsive usability, accessibility, privacy boundaries, database integrity, content/catalog integrity, and deployment integrity.

## Test layers

### 1. Domain unit tests

MUST cover:

- item/answer validation;
- keyed and counter-keyed scoring;
- weighted scoring;
- normalization and rounding;
- completion eligibility;
- confidence/quality metadata;
- Core Code generation;
- Extended Code generation;
- threshold/tie behavior;
- interaction activation;
- content precedence/conflict suppression;
- structured result composition;
- result snapshot serialization;
- version mismatch/fail-closed behavior.

Current domain suite covers all current Phase 2A engine components. Production public content and future model versions add new fixtures rather than replacing historical ones.

### 2. Golden diagnostic fixtures

For each publishable model keep fixed answer/result fixtures with exact expected:

- normalized scores;
- confidence fields;
- Core Type/Code;
- Extended Code;
- interaction IDs;
- selected/suppressed content module IDs/order;
- serialized snapshot essentials.

Current development golden fixture:

- `tests/fixtures/golden-result-snapshot-midpoint-v0.1.json`.

`tests/domain/result-snapshot.test.ts` compares the generated snapshot to this fixed artifact exactly and also verifies answer-order invariance.

Golden tests are release-blocking. A changed expected result requires an intentional model/content/version decision, not casual fixture regeneration.

### 3. Property/invariant tests

Current and required invariants include:

- same input/version always equals same output;
- answer/score input order does not alter result;
- invalid option values never produce scores;
- score remains in valid range;
- duplicate/missing/unknown data fails;
- inactive/off-model item cannot be persisted as an answer;
- published model/content artifacts cannot mutate;
- immutable result snapshot cannot update;
- retention/privacy deletion remains possible;
- authoritative requirement IDs cannot be silently shadowed by derivative documents;
- development type-catalog reachability exactly matches the versioned Core Code schema;
- public share payload must never contain raw answers/session secrets when Phase 4 is implemented.

### 4. Persistence and application integration tests

Current CI starts PostgreSQL 16 and runs the real migration chain.

`tests/infrastructure/postgres-integration.mjs` verifies at least:

- ordered migration application;
- published model row update/delete rejection;
- published model-item insert/update rejection;
- published content module/version mutation rejection;
- immutable Trait/item revision behavior;
- off-model answer rejection;
- 1..5 answer database constraint;
- scoring-version and `score_bp` constraints;
- snapshot indexed-version/session/model consistency;
- snapshot update rejection;
- session completion prerequisites;
- answer/session freeze after completion;
- result-snapshot deletion remains available for retention/privacy handling.

`tests/infrastructure/anonymous-assessment-repository.integration.test.ts` additionally verifies the real typed adapter:

- anonymous session creation;
- browser-facing raw token is not stored;
- DB stores only SHA-256 token hash;
- answer persistence;
- transactional Trait Score + immutable Snapshot + completion;
- private result retrieval via bearer token;
- post-completion write rejection.

`tests/application/server-assessment-service.integration.test.ts` verifies the complete reviewed development model application flow through PostgreSQL:

- 147-item model delivery;
- answer save/resume;
- deterministic finalization;
- 21 Trait scores;
- Core/Extended Code;
- 18 result sections;
- idempotent duplicate completion;
- post-completion answer mutation rejection.

Remaining integration work is now primarily production/release-specific:

- deployment-specific backup/restore rehearsal;
- development/preview/production environment separation;
- deployed monitoring/alerting;
- production trusted-proxy/TLS/least-privilege/secret-store evidence;
- consented calibration/export paths after governance approval.

### 5. End-to-end tests

Current Chromium E2E covers:

`landing -> diagnosis -> anonymous start -> answer -> back/edit -> all 147 answers -> finish -> private result/reload -> explicit public share -> cookie-free public view/cards -> revoke`

Additional current E2E coverage includes:

- fresh-browser private-result isolation;
- actual `Tab` / `Shift+Tab` / `Space` / `Enter` traversal through all 147 questions and finalization;
- mandatory 320/390/768/1024/1280/1440 width checks with document-level overflow assertions;
- touch-enabled 390px mobile selection/advance;
- semantic progress/radiogroup/result-meter assertions;
- focus-visible and reduced-motion behavior;
- automated axe WCAG A/AA scans on the tested core pages;
- privacy-safe analytics/error/performance contracts;
- security headers;
- privacy-safe rate limiting;
- health/readiness response.

Still required in later QA layers:

- screenshot-diff visual regression baselines;
- real screen-reader / assistive-technology walkthrough;
- browser text zoom/text scaling review;
- richer expired/error recovery UX;
- final production-content/illustration accessibility review.

### 6. Requirement and catalog integrity validators

`scripts/validate-requirement-ids.mjs` validates requirement declaration integrity across `REQUIREMENTS.md` and `docs/requirements/*.md`.

It rejects:

- duplicate declarations in one document;
- unapproved derivative shadowing of Master IDs;
- duplicate detailed IDs across derivative documents;
- accidental expansion of the small explicit Master/detail alias allowlist.

`scripts/validate-type-catalog.mjs` recomputes all legal combinations from `data/code-schema/v0.1-dev.json` and verifies `data/type-catalog/v0.1-dev/reachability.json`.

It rejects:

- schema/token mismatch;
- public promotion of the development catalog;
- wrong 2^N count;
- missing/duplicate/impossible Core Codes;
- canonical enumeration order drift;
- invalid one-axis-neighbor closure.

These validators prove engineering consistency only. They do not validate psychological constructs or editorial claims.

## Responsive visual QA

Functional responsive verification is now automated at:

- 320 × 844;
- 390 × 844;
- 768 × 1024;
- 1024 × 768;
- 1280 × 800;
- 1440 × 900.

Run 329 (`33044207630`) verifies landing/assessment functionality and no document-level horizontal overflow at every mandatory width, then verifies the completed private result across the same width matrix. This is the current evidence for Master `PCS-FE-005`.

Screenshot-diff visual regression is intentionally a separate gate. Master `PCS-QA-006` remains open until committed visual baselines/diffs cover the critical landing, assessment, result, adversarial/share/public-result states.

## Accessibility QA

Automated scans are necessary but insufficient.

Current automated evidence (Run 329 / `33044207630`):

- actual keyboard focus traversal completes all 147 questions and finalization without mouse/touch;
- focus-visible is machine checked;
- progress/radiogroup/error/result-meter semantics are asserted;
- selected state is not color-only;
- reduced-motion behavior is asserted;
- 44px practical assessment targets are asserted;
- touch-enabled mobile assessment interaction is exercised;
- axe WCAG A/AA-tagged scans pass on tested landing, assessment and completed private-result states;
- contrast defects originally detected by axe were fixed in the application palette, not excluded from the scan.

This completes Master `PCS-A11Y-001`. Master `PCS-A11Y-002` and `PCS-QA-005` remain open for human assistive-technology/zoom/final release review.

Manual release checklist:

- [ ] complete assessment without mouse/touch;
- [ ] visible focus on every interactive element;
- [ ] logical focus order;
- [ ] screen-reader labels for scale options/progress;
- [ ] selected states understandable without color;
- [ ] browser zoom/text scaling usable;
- [ ] reduced motion honored;
- [ ] no horizontal core-content scroll at 320px;
- [ ] touch targets usable on phone;
- [ ] headings/landmarks coherent.

## Privacy/security QA

Release checks:

- raw answer absent from URL/OG/public API;
- analytics network payload audit;
- session/share ID enumeration resistance;
- server-side schema validation;
- XSS/content escaping;
- rate-limit behavior;
- security headers;
- no source-map/stack/secret leakage inappropriate for production;
- dependency vulnerability scan/review;
- no AI API key/dependency required.

Current privacy evidence includes hash-only anonymous session credentials, HttpOnly/SameSite bearer-cookie transport, raw-answer separation from result snapshots/URLs, server-side model-bound writes and browser private-result isolation.

## Performance QA

Measure at least landing, assessment, and result pages. Investigate regressions in:

- LCP;
- INP;
- CLS;
- JS payload;
- image weight;
- server response time;
- database/query latency.

## CI gates

Current CI performs, in order:

1. production dependency vulnerability audit;
2. authoritative requirement-ID validation;
3. development Core Type/display-name/content/illustration integrity validation;
4. reviewed Item Bank validation;
5. analytics privacy/retention-policy validation;
6. security-header/rate-limit policy validation;
7. persistence migration/static invariant validation;
8. real PostgreSQL persistence and application integration, including rate-limit/retention behavior;
9. analytics/rate-limit retention dry-run;
10. domain/infrastructure unit and Golden Snapshot tests;
11. TypeScript typecheck;
12. Next.js production build;
13. Chromium E2E covering the full assessment/share journey plus responsive, keyboard, touch, axe, security and telemetry contracts.

Later release gates still require:

- human assistive-technology/text-zoom accessibility review;
- screenshot-diff visual regression;
- final release security/privacy checklist;
- performance budgets/lab evidence;
- deployed environment/operations QA.

## Bug severity

Release-blocking examples:

- same input gives different diagnostic result;
- wrong type/code due to scoring bug;
- historical result mutates after content/model update;
- model/item/content publication can be silently rewritten;
- requirement IDs silently change meaning;
- catalog omits a reachable public type;
- answer leak in public/share/analytics path;
- assessment unusable on supported mobile width;
- keyboard cannot complete test;
- public share IDs practically enumerable;
- production build/test failure.

Editorial cosmetic issues may be non-blocking only if they do not change meaning or accessibility.
