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
- hostile cross-site mutation rejection with no persisted side effect and privacy-safe 403 response, including destructive diagnostic deletion;
- health/readiness response.

Still required in later QA layers:

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

Screenshot-diff visual regression is now a separate enforced CI gate.

Current committed Linux/Chromium baseline set:

- landing at 320/390/768/1024/1280/1440;
- first assessment screen at the same six widths;
- completed deterministic private result at 390/1440;
- sanitized public share at 390/1440.

The 16 PNG baselines live beside `tests/e2e/visual-regression.spec.ts`. Normal CI runs comparison mode with `PCS_VISUAL_REGRESSION=1` and does **not** use `--update-snapshots`. CI Runs 343/344 passed the committed baseline comparison. A dedicated baseline-update workflow is documented in `docs/reviews/VISUAL_REGRESSION_QA_v0.1.md`.

This completes Master `PCS-QA-006` for the current development application. Final production artwork/copy changes will intentionally require reviewed baseline updates.

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

Current privacy/security automation additionally includes:

- the versioned seven-class privacy data inventory and migration-to-inventory exact-coverage validator;
- the anonymous diagnostic self-deletion contract/validator, repository integration test, cascade-guard negative tests, cookie invalidation browser flow and hostile-origin deletion rejection;
- default prohibition of direct identity, precise-location, media, and contacts collection in the normal application surface;
- release static scanning for runtime AI dependencies/imports, sensitive public environment names, obvious committed secrets/private keys, unsafe dynamic HTML/code execution, and Client Component access to server-only environment variables;
- Next.js framework-header suppression with production browser source maps disabled;
- post-build scanning of `.next/static` for source maps plus configured/server-only secret identifiers or values;
- trusted-origin / Fetch Metadata mutation guards on answer, completion, share creation, and share revocation;
- Chromium hostile-origin tests proving rejected writes do not persist and 403 bodies do not leak secrets, stacks, attacker origins, or internal hash-like values.

CI Run 373 (`33050505946`) is the current full-head evidence checkpoint for these automated controls. They materially advance Master **PCS-QA-007**, but do not complete it: deployed TLS termination, trusted-proxy behavior, production database least privilege, external secret-store evidence, environment separation, and external penetration/security review remain manual/deployment release gates.

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
2. release-security/runtime-dependency static audit;
3. authoritative requirement-ID validation;
4. development Core Type/display-name/content/illustration integrity validation;
5. reviewed Item Bank validation;
6. analytics event/privacy validation;
7. privacy data-inventory and collection-minimization validation;
8. anonymous diagnostic self-deletion contract validation;
9. security-header/rate-limit policy validation;
10. persistence migration/static invariant validation;
11. real PostgreSQL persistence and application integration, including rate-limit/retention/privacy-deletion behavior;
12. analytics/rate-limit retention dry-run;
13. reviewed model-seed/application integration;
14. domain/infrastructure unit and Golden Snapshot tests;
15. TypeScript typecheck;
16. Next.js production build;
17. production client-artifact leakage audit;
18. production artifact performance-budget audit;
19. Chromium installation and E2E covering the full assessment/share/deletion journey plus responsive, keyboard, touch, axe, security/CSRF, telemetry and visual-regression contracts.

Later release gates still require:

- human assistive-technology/text-zoom accessibility review;
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


## Security/privacy manual release record

`data/security/security-privacy-release-review-v0.1-dev.json` and `docs/reviews/SECURITY_PRIVACY_RELEASE_QA_v0.1.md` now separate repository-verified controls from real deployment/manual controls. `scripts/validate-security-release-review.mjs` requires the latter to remain pending and keeps PCS-QA-007 open until inspectable production evidence exists.
