# 13 — Requirement Traceability

## Purpose

Traceability prevents requirements from becoming decorative documentation. A checked requirement should have evidence showing where it is implemented and how it is verified.

## Traceability record

From Phase 1 onward, maintain a table or machine-readable equivalent with at least:

| Requirement ID | Status | Implementation | Test/Evidence | Version impact | Notes |
| --- | --- | --- | --- | --- | --- |
| PCS-SCORE-004 | planned | — | — | assessment model | deterministic normalized scoring |

The table may later move to generated documentation if automated tooling is introduced, but requirement IDs remain stable.

## Status vocabulary

Use one of:

- `planned`
- `in-progress`
- `implemented-unverified`
- `verified`
- `blocked`
- `superseded`

The checkbox in `REQUIREMENTS.md` should normally be checked only when the corresponding requirement is `verified` or when it represents an already-completed foundational decision with direct evidence.

## Acceptable evidence

Depending on the requirement:

- source file/function path;
- unit/integration/E2E test name;
- golden fixture;
- CI run;
- visual regression screenshot;
- accessibility audit/checklist;
- privacy/network payload audit;
- statistical analysis report/notebook;
- approved content/illustration catalog entry;
- release artifact/tag;
- migration/restore test record.

A commit hash alone is insufficient if it does not demonstrate requirement behavior.

## Machine-readable change ledger

Material changes are now additionally recorded in `data/governance/requirement-change-ledger-v0.1-dev.json`. CI validates that the ledger targets the current Master Requirements version/date, references only real requirement IDs, and records rationale plus assessment-model, code-schema, content, data-migration and compatibility impact.

The Markdown examples below remain useful narrative release notes; the machine ledger is the release-blocking minimum record.

## Requirement change record

For every material requirement change record:

- date;
- affected requirement IDs;
- old behavior/requirement;
- new behavior/requirement;
- rationale;
- impacted files;
- assessment model impact;
- code schema impact;
- content impact;
- data migration impact;
- compatibility impact;
- tests/evidence updated.

Suggested format:

```md
### YYYY-MM-DD — Short title
- IDs: PCS-...
- Change: ...
- Reason: ...
- Versions: assessment none / content X -> Y / app ...
- Evidence: ...
```

## Version impact decision

Every diagnostic-related change must answer:

### Assessment model version changes if

- active item membership changes;
- semantic item wording changes;
- scoring weights/directions/formula change;
- normalization/completion rules change;
- trait definition materially changes in a way that changes measurement interpretation;
- Core classification boundary is defined as part of assessment model and changes.

### Code schema version changes if

- public code syntax/meaning changes;
- Core/Extended Code fields are reinterpreted;
- parsing/backward compatibility changes.

### Content version changes if

- result claim/prose meaning changes;
- module activation/precedence changes without changing underlying measurement;
- type names/descriptions materially change.

### Asset version changes if

- type illustration/share template changes while result semantics stay stable.

### App-only change if

- layout/visual/implementation changes produce no diagnostic/content semantic change.

## Contradiction audit checklist

Before checking a milestone complete:

- [ ] master requirement and derivative file agree;
- [ ] old supporting docs do not contain known contradictory guidance;
- [ ] implementation follows the documented version;
- [ ] tests reflect current intended behavior;
- [ ] public copy does not overclaim evidence status;
- [ ] no AI runtime dependency has been introduced;
- [ ] privacy/analytics behavior still matches docs.

## Current traceability

| Scope / Requirement | Status | Implementation | Test / Evidence | Version impact | Notes |
| --- | --- | --- | --- | --- | --- |
| PCS-FE-001 | verified | Next.js/React/TypeScript scaffold | CI typecheck + build | app | foundation |
| PCS-FE-002 | verified as foundation | responsive CSS and assessment UI | browser E2E foundation | app | authored non-AI visual system |
| PCS-FE-005 | verified current application | 320/390/768/1024/1280/1440 functional width matrix | Run 329 (`33044207630`) landing/assessment/result overflow checks | app/responsive | screenshot-diff visual regression remains QA-006 |
| PCS-A11Y-001 | verified | real keyboard focus traversal through all 147 questions + finalization | Run 329; `responsive-accessibility.spec.ts` | app/a11y | Tab/Shift+Tab/Space/Enter only |
| PCS-A11Y-002 | in-progress | semantic progress/radiogroup/error/meters, accessible palette, focus/reduced-motion/touch checks, axe scans | Run 329 | app/a11y | real assistive-tech/text zoom/final production review remains |
| PCS-QA-005 | in-progress | automated axe + keyboard/touch/mobile coverage | Run 329 + `RESPONSIVE_ACCESSIBILITY_QA_v0.1.md` | QA/a11y | human assistive-tech/zoom/manual release review remains |
| PCS-QA-006 | verified current development application | 16 committed Linux/Chromium screenshot baselines + normal CI comparison mode + branch-safe controlled refresh | CI Run 762 (`33240042395`), Run 764 (`33240600043`), Visual Baseline Run 18 (`33240600054`); `VISUAL_REGRESSION_QA_v0.1.md` | QA/visual | PR #11 refreshed landing baselines intentionally; future production art/copy changes require reviewed baseline updates |
| PCS-QA-001 | verified | `.github/workflows/ci.yml` | validators + dependency audit + PostgreSQL/app/domain + typecheck/build + expanded Chromium E2E | app/QA | current CI includes responsive/keyboard/touch/axe/security/telemetry gates |
| PCS-GOV-001..010 | verified as governance decisions | `REQUIREMENTS.md` + derivative requirement set | requirement-ID validator | governance | master meanings remain authoritative |
| PCS-SCORE-001..006 | verified as development model engineering | reviewed Item Bank + scoring domain | Item Bank validators, scoring Golden tests | assessment | statistical calibration remains Phase 5 |
| PCS-RESULT-001..005 | verified as development result engine | Core/Extended Code, Interaction, Composer, Snapshot | domain tests + frozen snapshots | result/content | public taxonomy not implied |
| Phase 2B persistence foundation | verified | Drizzle/PostgreSQL repositories and migrations | PostgreSQL integration suite | persistence | private result/version immutability |
| Phase 2C real development assessment | verified | assessment API/UI/private result | Chromium 147-item E2E | app/model | historical successful Phase 2 CI evidence retained |
| Phase 3A Core editorial materialization | verified as non-public development engineering | `data/type-catalog/v0.1-dev/*`, content v0.2/v0.3 materializers | CI Run 177+, `validate:type-catalog`, `validate:content`, v0.2/v0.3 Golden snapshot tests | content | human editorial/public schema approval still pending |
| Phase 3A draft display-name system | verified mechanically / human approval pending | `display-name-system.ja.json`, `materialize-type-display-names.mjs` | CI type-display-name validator + `docs/reviews/TYPE_NAMES_v0.1-dev.md` | content/name | 64 names are traceable/unique; public wording remains pending |
| PCS-CONTENT-010..015 | in-progress | versioned Core/Trait editorial primitives | content validators + review ledger | content | human Japanese/Interaction review still required |
| PCS-ART-010..015 | in-progress foundation only | `docs/ILLUSTRATION_SYSTEM.md`, `data/illustration/v0.1-dev/system.json` | `validate-illustration-slots.mjs` | asset | 64 slots exist; actual hero artwork remains `unproduced` |
| PCS-PROD-007 / PCS-PRIV-004 | verified | explicit `/api/share` export from private result | Chromium E2E: no public result before action; share created only by button/API | app/privacy | completion remains private |
| PCS-ARCH-003 | verified | `shareSnapshot.ts`, `publicShareRepository.ts`, PostgreSQL share insert guard | domain/repository/PostgreSQL tests + cookie-free public E2E | persistence/privacy | public snapshot excludes raw answers/Trait vector/private result internals |
| PCS-SOC-002 | verified development implementation | `ShareControls.tsx`, `/api/share` | Chromium X/LINE/Web Share/copy assertions | app/share | no social OAuth |
| PCS-SOC-003 | verified development fallback | `/s/[token]` metadata + versioned `/api/share/og/v0.1/[token]` | CI Run 190, image/status/metadata E2E | app/share-template | final curated artwork remains PCS-SOC-001 |
| Phase 4A-1 sanitized sharing | verified | share schema/token/repository/API/public page/card routes | CI Run 190 + PostgreSQL + browser E2E | persistence/app/share | 4A-2 final public-name/art presentation pending |
| PCS-PRIV-003 / PCS-ANA-001 | verified development implementation | first-party event dictionary/API/repository + funnel wiring | CI Run 238 (`33036549731`) real network + DB telemetry assertions | analytics/app/privacy | answer values and diagnostic vectors excluded; third-party export disabled |
| PCS-ANA-002 | in-progress foundation | exact-scope observed distribution domain/repository | CI Run 240 (`33036572687`) domain + immutable-snapshot DB aggregation | analytics/statistics | public model/eligibility/minimum-sample/privacy wording gate remains |
| PCS-ANA-003 | advanced pre-collection/control foundation / raw materialization blocked | calibration export + consent/governance/operator auth + execute-only two-person export-control + Wave JA-01 SHA-256 scope-freeze contracts | validators + PostgreSQL operator/consent/auth/control least-privilege evidence + request/review/decision audit + scope-freeze digest verification | privacy/research | external preregistration/legal/environment/operator provisioning/materializer/purge remain; ordinary analytics never becomes calibration data |
| Phase 4B-3 retention/observability | verified development implementation | retention policy/repository/CLI, fixed error telemetry, Web Vitals sanitizer, health route | CI Runs 269/270/272/273 | analytics/ops/privacy | production scheduler/external monitoring/environment separation remain |
| PCS-SEC-001 | verified development implementation | hash-only capabilities, server validation, HMAC PostgreSQL rate limits, security headers, production dependency audit | Run 304 (`33038326772`), Run 307 security validator/audit, Run 309 latest HEAD | security/app/persistence | trusted proxy/TLS/least privilege/deployment secret store/final security QA remain release gates |
| PCS-OPS-003 | in-progress | minimal DB readiness + client error/performance telemetry | Runs 269/272/273 | operations | independent production monitoring and alerting remain |

## Phase 3 evidence map

### Type identity / naming

- Reachability source: `data/type-catalog/v0.1-dev/reachability.json`
- Structural/editorial scaffold: `data/type-catalog/v0.1-dev/editorial-scaffold.json`
- Core editorial primitives: `data/type-catalog/v0.1-dev/editorial-primitives.ja.json`
- Draft display-name vocabulary: `data/type-catalog/v0.1-dev/display-name-system.ja.json`
- Materializer: `scripts/materialize-type-display-names.mjs`
- Validator: `scripts/validate-type-display-names.mjs`
- Human review ledger: `docs/reviews/TYPE_NAMES_v0.1-dev.md`
- Design contract: `docs/TYPE_DISPLAY_NAME_SYSTEM.md`

### Detailed deterministic dossier

- Base development content: `data/content/dev-v0.1.json`
- Type-content release manifest: `data/content/dev-v0.2.json`
- Detailed Trait-content release manifest: `data/content/dev-v0.3.json`
- Trait editorial primitives: `data/content/trait-editorial-primitives.ja-v0.1-dev.json`
- Materializers: `scripts/materialize-content-v0.2.mjs`, `scripts/materialize-content-v0.3.mjs`
- Validators: `scripts/validate-content-v0.2.mjs`, `scripts/validate-content-v0.3.mjs`
- Golden fixtures: `tests/fixtures/result-snapshot-midpoint-v0.2.json`, `tests/fixtures/result-snapshot-midpoint-v0.3.json`
- Exact tests: `tests/domain/result-snapshot-v0.2.mjs`, `tests/domain/result-snapshot-v0.3.mjs`

### Illustration foundation

- Art direction: `docs/ILLUSTRATION_SYSTEM.md`
- Machine-readable motif/slot grammar: `data/illustration/v0.1-dev/system.json`
- Slot materializer: `scripts/materialize-illustration-slots.mjs`
- Slot validator: `scripts/validate-illustration-slots.mjs`
- Current status: all 64 C01D hero slots deliberately `unproduced`; no production image is implied by the mapping itself.

## Phase 4A sanitized sharing evidence

- Public share contract: `src/domain/sharing/shareSnapshot.ts`
- Hash-only public capability: `src/infrastructure/persistence/publicShareToken.ts`
- Public share repository/lifecycle: `src/infrastructure/persistence/publicShareRepository.ts`
- Typed share table: `src/infrastructure/persistence/sharingSchema.ts`
- DB migration/privacy guards: `drizzle/0002_phase4a_public_share_snapshots.sql`
- Explicit mutation API: `src/app/api/share/route.ts`
- Private owner controls: `src/app/result/ShareControls.tsx`
- Cookie-free public route: `src/app/s/[token]/page.tsx`
- Deterministic image renderer: `src/app/api/share/_image.tsx`
- Versioned OG route: `src/app/api/share/og/v0.1/[token]/route.tsx`
- Versioned portrait route: `src/app/api/share/card/v0.1/[token]/route.tsx`
- Domain/token/repository tests: `tests/domain/share-snapshot.test.ts`, `tests/infrastructure/public-share-token.test.ts`, `tests/infrastructure/public-share-repository.integration.test.ts`
- DB adversarial checks: `tests/infrastructure/postgres-integration.mjs`
- End-to-end public/private boundary and card determinism: `tests/e2e/assessment-flow.spec.ts`
- Successful evidence checkpoint: GitHub Actions CI Run `33020306036` / Run 190.

The public share is a deliberate sanitized export. It is not a different view over the private snapshot and cannot retrieve raw answers, the Trait vector, Extended Code, Response Quality or private bearer credentials.

## Phase 4B analytics evidence

- Event dictionary: `data/analytics/event-dictionary-v0.1-dev.json`
- Validator: `scripts/validate-analytics-events.mjs`, `src/domain/analytics/productEvent.ts`
- Persistence: `src/infrastructure/persistence/analyticsSchema.ts`, `analyticsRepository.ts`, `drizzle/0003_phase4b_first_party_analytics.sql`
- First-party endpoint/browser transport: `src/app/api/analytics/route.ts`, `src/app/_analytics/client.ts`
- Server best-effort instrumentation: `src/server/productAnalytics.ts`
- Browser privacy proof: `tests/e2e/assessment-flow.spec.ts`; CI Run `33036549731` / Run 238
- Analytics privacy/retention design: `docs/model/ANALYTICS_PRIVACY_BASELINE_v0.1.md`
- Observed distribution: `src/domain/analytics/observedTypeDistribution.ts`, `src/infrastructure/persistence/typeDistributionRepository.ts`
- Distribution policy: `docs/model/OBSERVED_TYPE_DISTRIBUTION_SPEC_v0.1.md`
- Distribution integration proof: CI Run `33036572687` / Run 240
- Calibration gate: `docs/model/CALIBRATION_EXPORT_SPEC_v0.1.md`

### 2026-08-27 — First-party privacy-bounded funnel analytics
- IDs: PCS-PRIV-003, PCS-ANA-001
- Change: add versioned first-party-only funnel telemetry across landing, assessment, result and share journeys.
- Reason: measure product completion/drop-off without creating a second diagnostic dataset.
- Versions: `analytics-events-v0.1-dev`; assessment/scoring/code/content semantics unchanged.
- Evidence: CI Run 238 inspects actual browser analytics requests and DB rows, proving answer interactions contain only item position/state while server injects model identity.
- Remaining: production retention cleanup, environment separation, legal/consent review and operational monitoring.

### 2026-08-27 — Scoped observed type-distribution foundation
- IDs: PCS-ANA-002
- Change: aggregate immutable completed snapshots by exact model/code/locale/time scope with sample size and basis-point shares.
- Reason: support future honest observed-sample statistics without theoretical rarity fabrication.
- Versions: `observed-type-distribution-v0.1-dev`.
- Evidence: CI Run 240 domain + application/DB integration.
- Remaining: production model freeze, valid-assessment exclusion policy, minimum sample/privacy threshold and public wording approval; requirement remains open.

### 2026-08-27 — Retention and observability foundation
- IDs: PCS-ANA-001, PCS-OPS-003, Phase 4B
- Change: add versioned 30/90-day analytics retention policy, cleanup repository/CLI, fixed-category client error telemetry, bucket-only Web Vitals and a minimal DB readiness endpoint.
- Reason: make product telemetry operationally useful without allowing raw error text, stack traces, raw performance values or indefinite first-party event retention.
- Versions: `analytics-retention-v0.1-dev`; analytics event dictionary remains `analytics-events-v0.1-dev`.
- Evidence: Run 269 browser error telemetry, Run 270 retention cleanup/dry-run, Run 272 health endpoint, Run 273 analytics API privacy rejection tests.
- Remaining: scheduled production execution, environment separation, independently durable server/API/database monitoring and alerting.

### 2026-08-27 — Security baseline completion
- IDs: PCS-SEC-001, PCS-QA-001
- Change: add global production browser hardening headers, versioned HMAC-backed fixed-window rate limits for public mutation/analytics endpoints, privacy-safe 429 behavior, production dependency vulnerability audit and machine security-policy validation.
- Reason: complete the Master security implementation without persisting raw IP/session principals or exposing rate-limit internals.
- Versions: app/security only; `rate-limits-v0.1-dev`; assessment/scoring/code/content semantics unchanged.
- Evidence: Run 304 verifies PostgreSQL rate limiting, 20-allowed/21st-429 behavior, `Retry-After`, principal non-disclosure and security headers; Run 307 verifies the security baseline/audit gate; Run 309 is green on the resulting HEAD.
- Remaining: production trusted-proxy/TLS/DB-least-privilege/secret-store evidence and final PCS-QA-007 review.

### 2026-08-27 — Responsive and keyboard accessibility verification
- IDs: PCS-FE-005, PCS-A11Y-001, PCS-A11Y-002, PCS-QA-005, PCS-QA-006
- Change: add mandatory-width functional QA, actual keyboard focus traversal through the full 147-item assessment, mobile touch coverage, semantic progress/radiogroup/result meters, reduced-motion/focus/target-size checks, and axe WCAG A/AA scans.
- Reason: replace “responsive CSS exists” and pointer-only assumptions with executable user-flow evidence.
- Versions: app/QA only; assessment/scoring/code/content semantics unchanged.
- Evidence: CI Run 329 (`33044207630`) passes the complete suite. Axe-detected landing/assessment/result contrast defects were corrected in CSS rather than waived.
- Status: FE-005, A11Y-001 and QA-006 verified for the current development application; A11Y-002/QA-005 remain open for real assistive-technology/text-zoom/manual release review.

### 2026-08-27 — Visual regression baseline enforcement
- IDs: PCS-QA-001, PCS-QA-006, PCS-FE-005
- Change: freeze 16 Linux/Chromium screenshots covering landing/assessment at six mandatory widths plus completed private result/public share at mobile/desktop; add controlled baseline workflow and normal-CI comparison mode.
- Reason: detect unintended visual drift separately from functional responsive assertions.
- Versions: app/QA only; assessment/scoring/code/content semantics unchanged.
- Evidence at baseline establishment: baselines committed by Visual Baseline workflow; CI Runs 343/344 passed comparison without `--update-snapshots`; Visual Baseline Run 7 reproduced the historical set from the committed lockfile. Current evidence after the PR #11 landing refresh is CI Run 762 (`33240042395`) / Run 764 (`33240600043`) plus Visual Baseline Run 18 (`33240600054`).
- Remaining: final production illustrations/type copy will intentionally require reviewed baseline updates.

## Material change records

### 2026-08-27 — Sanitized public share foundation
- IDs: PCS-PROD-007, PCS-ARCH-003, PCS-PRIV-004, PCS-SOC-002, PCS-SOC-003
- Change: add an explicit private-to-public export boundary with hash-only public capability tokens, immutable sanitized snapshots, cookie-free public pages, X/LINE/Web Share/copy controls, deterministic versioned OG/portrait cards and revocation.
- Reason: support SNS sharing without exposing the 147 answers, Trait vector, Extended Code or private session credential.
- Versions: `share-snapshot-v0.1-dev`, `share-og-v0.1-dev`, `share-portrait-v0.1-dev`; assessment/scoring/code semantics unchanged.
- Evidence: PostgreSQL share guards, repository/domain tests and CI Run 190 Chromium flow including byte-identical repeated card renders and revoked-route 404s.
- Remaining: production type names, curated hero assets and deployed crawler/CDN QA remain Phase 3A/3B/4A-2.


### 2026-08-27 — Versioned Phase 3 editorial generations
- IDs: PCS-CONTENT-001..003, PCS-CONTENT-010..015
- Change: development result copy advanced from fallback-heavy `content-dev-v0.1` to type-specific v0.2 and detailed Trait-band v0.3 while preserving earlier releases.
- Reason: add high-resolution deterministic result content without mutating historical snapshots.
- Versions: assessment-dev-v0.1/v0.2/v0.3 and content-dev-v0.1/v0.2/v0.3 coexist; scoring/code/interaction semantics remain unchanged.
- Evidence: materializers, seed integration, Golden snapshots, Application/E2E assertions.

### 2026-08-27 — Draft display-name grammar
- IDs: PCS-CONTENT-010, PCS-CONTENT-014, PCS-CONTENT-015
- Change: add reversible `{action}の{role}〈relationship〉` development display-name grammar for all 64 C01D codes.
- Reason: improve human recognition and future social-card/illustration identity while preserving six-axis claim provenance.
- Versions: independent `type-display-name-system-ja-v0.1-dev`; `public_use=false`.
- Evidence: 64-name validator and explicit review ledger. Public owner approval remains open.

### 2026-08-27 — Illustration identity foundation
- IDs: PCS-ART-010..015
- Change: define non-AI runtime art direction and stable 64 development asset slots.
- Reason: allow art production to proceed without ad-hoc per-type prompts or mutable runtime generation.
- Versions: `illustration-system-v0.1-dev`; all slots unproduced.
- Evidence: illustration slot materializer/validator and art-direction specification.


### 2026-08-28 — Version-impact change ledger gate
- IDs: governance/process requirement; affected operational IDs are listed per machine entry.
- Change: introduce `requirement-change-ledger-v0.1-dev` and CI validation tied to Master Requirements v0.11.7.
- Reason: prevent material requirement changes from being merged without an explicit assessment/code/content/data/compatibility decision.
- Versions: governance-only; current assessment/code/content versions unchanged.
- Evidence: `npm run validate:change-ledger` in normal CI.
