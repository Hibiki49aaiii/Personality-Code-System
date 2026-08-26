# 10 — Testing and QA Requirements

## QA principle

PCS correctness means more than “the page renders.” A release must verify diagnostic determinism, historical reproducibility, responsive usability, accessibility, privacy boundaries, database integrity, and deployment integrity.

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
- public share payload must never contain raw answers/session secrets when Phase 4 is implemented.

### 4. Persistence integration tests

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

Remaining Phase 2C/4 integration work:

- HTTP/server-action start/resume endpoints;
- active model delivery;
- full 147-answer end-to-end finalization through web handlers;
- explicit public share snapshot creation/retrieval;
- unknown/expired/invalid HTTP error behavior.

### 5. End-to-end tests

Critical future user path:

`landing -> start -> answer all -> navigate back/edit -> finish -> result -> optional share`

Also test:

- reload/resume;
- accidental double click/submit;
- mobile layout path;
- keyboard-only path;
- public shared-result visit;
- private/nonexistent result access;
- error recovery.

## Responsive visual QA

Automated screenshots/visual regression SHOULD cover at least:

- 320x representative mobile height;
- 375/390 mobile;
- 768 tablet;
- 1024 landscape/small desktop;
- 1280 desktop;
- 1440+ wide desktop.

Critical pages:

- landing;
- assessment first/mid/final question;
- result hero;
- long result domain;
- adversarial section;
- share controls/public result once implemented.

## Accessibility QA

Automated scans are necessary but insufficient.

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

Current persistence-specific privacy evidence includes hash-only anonymous session credentials and raw-answer separation from result snapshots.

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

1. reviewed Item Bank validation;
2. persistence migration/static invariant validation;
3. real PostgreSQL persistence + typed repository integration;
4. domain/infrastructure unit and golden tests;
5. TypeScript typecheck;
6. Next.js production build.

Later release gates still require:

- browser E2E;
- automated/manual accessibility;
- visual regression;
- security/dependency review;
- performance budgets.

## Bug severity

Release-blocking examples:

- same input gives different diagnostic result;
- wrong type/code due to scoring bug;
- historical result mutates after content/model update;
- model/item/content publication can be silently rewritten;
- answer leak in public/share/analytics path;
- assessment unusable on supported mobile width;
- keyboard cannot complete test;
- public share IDs practically enumerable;
- production build/test failure.

Editorial cosmetic issues may be non-blocking only if they do not change meaning or accessibility.
