# Requirements Traceability Matrix

> Status: active from Phase 1 onward
> Last updated: 2026-08-27

A checkbox in `REQUIREMENTS.md` is marked complete only when inspectable specification/implementation/verification evidence exists. `complete` never implies psychometric validation unless the requirement explicitly concerns validation evidence.

| Requirement | Status | Specification / Evidence | Implementation | Verification |
| --- | --- | --- | --- | --- |
| PCS-GOV-001..010 | complete (policy/invariants) | `REQUIREMENTS.md`, `docs/requirements/00_GOVERNANCE.md` | deterministic domain/persistence/web boundaries; runtime AI prohibited | requirement-ID validator + CI/runtime architecture |
| PCS-PROD-002 | complete (development flow) | `01_PRODUCT_SCOPE.md` | anonymous session/cookie flow | Chromium E2E starts assessment without account |
| PCS-PROD-003 | complete (development flow) | reviewed 147-item model + Phase 2C exit | diagnosis UI/server/application/persistence | 147-answer Chromium E2E to result |
| PCS-PROD-004 | complete (development result) | structured-result/domain contract | Core/Extended Code + 21 Traits + metadata + 18 sections | application integration + Chromium result assertions |
| PCS-PROD-005 | complete (development result) | type/Trait editorial v0.3 | deterministic hidden-strengths + adversarial domains | content validator, Golden v0.3, application/browser assertions; production human QA still open |
| PCS-PROD-007 | complete (explicit export) | social-share requirements | private result `ShareControls` → POST `/api/share` → separate sanitized snapshot | Chromium proves completion alone stays private and explicit Share creates public URL |
| PCS-PROD-006 | complete (development result) | required 18 result domains | relationships/love, work, stress included in deterministic sections | result-engine fail-closed domain tests + application flow |
| PCS-DIAG-001 | complete (conceptual) | `docs/model/TRAIT_DICTIONARY_v0.2.md` | n/a | 21 retained Traits each define poles, boundaries, anchors, overlaps/domains |
| PCS-DIAG-002 | complete (conceptual) | `docs/model/TRAIT_OVERLAP_MATRIX_v0.2.md` | n/a | full retained-pair review; LDR/DEL/TRN removed from direct scoring |
| PCS-DIAG-003 | complete | Trait Dictionary presentation domains | `resultEngine.ts` required domain model | domains are views, not presumed independent latent factors |
| PCS-DIAG-004 | complete (hypothesis spec) | `TRAIT_INTERACTIONS_v0.1.md`, `data/interactions/v0.1.json` | `interactions.ts` | 20 deterministic conditions; boundary/order tests |
| PCS-DIAG-005 | complete (policy) | `VALIDATION_GATES_v0.1.md` | n/a | experimental/beta/stable/validated gates and prohibited claims defined |
| PCS-SCORE-001 | complete (candidate authoring) | `data/item-bank/v0.1/*` | machine-readable bank | `validate-item-bank.mjs`: 147 / 21 / 7 each / 4+3 direction |
| PCS-SCORE-002 | complete (editorial review) | `data/item-bank/v0.2/review.json`, `ITEM_BANK_REVIEW_v0.2.md` | `reviewedItemBank.ts` | v0.2 validator + tests: 98 accept / 39 r2 / 10 beta-hold; scoring keys invariant |
| PCS-SCORE-003 | partial | item/revision metadata + `assessment_model_releases` DB contract | production activation workflow remains Phase 5C | DB publication immutability tested; final active-release procedure open |
| PCS-SCORE-004 | complete (development engine) | `SCORING_SPEC_v0.1.md` | `scoring.ts`, `itemBank.ts` | scoring/candidate/reviewed-bank tests; exact integer bp normalization |
| PCS-SCORE-005 | complete (v0.1 baseline) | `SCORING_SPEC_v0.1.md` | `computeResponseQuality` | deterministic quality fixtures; metadata does not alter Trait Score |
| PCS-SCORE-006 | complete | Golden/manual scoring requirements | scoring/candidate/reviewed tests | min/mid/max, reverse keys, manual mixed, order invariance, invalid input |
| PCS-RESULT-001 | complete (experimental engineering spec) | `CORE_CODE_SPEC_v0.1-dev.md`, `data/code-schema/v0.1-dev.json` | `personalityCode.ts` | `personality-code.test.ts`; C01D `public_use=false` |
| PCS-RESULT-002 | complete (experimental engineering spec) | Core/Extended Code spec | `generatePersonalityCode`, `traitBandFromScoreBp` | exact boundaries/order/input invariance/missing+duplicate rejection |
| PCS-RESULT-003 | complete (development engine) | `04_CODE_AND_RESULT_ENGINE.md`, versioned content/rule data | `interactions.ts`, `contentComposer.ts`, `resultEngine.ts` | interaction + composer + result-engine tests |
| PCS-RESULT-004 | complete (development engine) | precedence/assertion/suppression contract | `contentComposer.ts` | disciplined-optimizer, deep-non-fused, inactive-generic and fallback contradiction fixtures |
| PCS-RESULT-005 | partial | snapshot requirements + retention/immutability contract | `resultSnapshot.ts`, PostgreSQL `result_snapshots` + triggers | fixed Golden Snapshot + PostgreSQL update/version-coherence tests; illustration asset version still pending |
| PCS-CONTENT-001 | pending public gate / active draft foundation | `TYPE_CATALOG_SPEC_v0.1-dev.md`, `reachability.json` | 64-code C01D development reachability manifest | `validate-type-catalog.mjs`; public schema and authored catalog still pending |
| PCS-CONTENT-002 | partial development engine only | required 18 domains + dev modules | development modules resolve all domains | production editorial coverage remains Phase 3A |
| PCS-CONTENT-003 | pending production editorial QA | adversarial rules in `04_CODE_AND_RESULT_ENGINE.md`, `05_CONTENT_AND_ILLUSTRATION.md` | dev adversarial/fallback modules | production authored adversarial catalog remains open |
| PCS-FE-003 | complete (Phase 2C development UX) | `06_FRONTEND_RESPONSIVE_UX.md` | real 147-item assessment UI | Chromium start/save/back/edit/complete flow |
| PCS-FE-004 | complete (Phase 2C development UX) | structured result hierarchy | real private result page | Chromium Core/Extended/Traits/18-section/reload assertions |
| PCS-FE-005 | pending | required width matrix | responsive CSS exists | explicit 320/375-390/768/1024/1280/1440+ verification not yet complete |
| PCS-A11Y-001..002 | pending | `06_FRONTEND_RESPONSIVE_UX.md`, `10_TESTING_QA.md` | semantic controls exist but no completion claim | keyboard/manual/automated a11y gate open |
| PCS-ARCH-001 | complete | `07_APPLICATION_ARCHITECTURE_AND_DATA.md` | `src/domain/assessment/*` isolated from React/DB | compile/tests independent of UI/database |
| PCS-ARCH-002 | complete (Phase 2B/2C foundation) | ADR-0001 + schema/application contract | schema, adapters, real server/application wiring | static migration validator + PostgreSQL 16 + application integration |
| PCS-ARCH-003 | complete | raw-answer/public-export separation contract | `shareSnapshot.ts`, hash-only public token/repository, DB insert guard, versioned public image routes | domain + PostgreSQL + repository + Chromium public/private boundary tests |
| PCS-ARCH-004 | complete (current persistence) | immutability contract | SQL triggers protect published model/items/content/revisions/snapshots | `postgres-integration.mjs` exercises actual rejection behavior |
| PCS-ARCH-005 | complete (foundation) | ADR-0001 migration/rollback policy | ordered committed SQL migrations | migration validator + PostgreSQL application in CI; deployment backup rehearsal is OPS |
| PCS-PRIV-001 | complete (anonymous private flow) | `08_PRIVACY_SECURITY.md` | opaque token + hash-only DB + HttpOnly/SameSite cookie | repository tests + fresh-browser private-result isolation |
| PCS-PRIV-002..003 | pending/partial | data minimization/analytics policy | no third-party analytics path yet | release privacy/network audit remains open |
| PCS-PRIV-004 | complete (development share flow) | opt-in public-share policy | POST `/api/share` requires private bearer cookie and explicit UI action | Chromium explicit-share flow + separate public snapshot persistence |
| PCS-SEC-001 | complete (development implementation) | `08_PRIVACY_SECURITY.md`, `rate-limits-v0.1-dev`, security-header baseline | opaque/hash-only capabilities, server validation, HMAC DB-backed rate limits, privacy-safe 429s, CSP/HSTS/frame/nosniff/referrer/permissions headers, production dependency audit | CI Run 304 (`33038326772`) rate-limit/security E2E + Run 307 security validator/audit + Run 309 latest full HEAD | deployment TLS/trusted proxy/DB least privilege/final QA remain OPS/QA gates |
| PCS-QA-001 | complete (current CI) | `10_TESTING_QA.md` | `.github/workflows/ci.yml` | requirements → type/content/item/analytics/security/persistence validators → production dependency audit → PostgreSQL/app/domain → retention dry-run → typecheck/build → Chromium E2E |
| PCS-QA-002 | complete (current domain pipeline) | result/scoring/code requirements | full current domain engine | scoring/code/interaction/composer/result/snapshot suites |
| PCS-QA-003 | complete (development fixture) | Golden snapshot rule | `golden-result-snapshot-midpoint-v0.1.json` | exact equality + answer-order invariance tests |
| PCS-SOC-002 | complete (development implementation) | `09_SOCIAL_SHARING_AND_ANALYTICS.md` | Web Share, X intent, LINE intent, URL copy on private result | Chromium assertions against exact opaque share URL |
| PCS-SOC-003 | complete (development fallback) | versioned sanitized OG contract | dynamic share metadata + `/api/share/og/v0.1/[token]` | Run 190: image/png, template header, byte determinism, revoked 404 |
| PCS-PRIV-003 / PCS-ANA-001 | complete (development implementation) | `event-dictionary-v0.1-dev`, `/api/analytics`, server/client funnel wiring, `product_events` | CI Run 238 (`33036549731`): Chromium network payload + DB assertions | first-party only; answer values/Trait vectors/private tokens are prohibited and third-party export defaults off |
| PCS-ANA-002 | in-progress foundation | `observedTypeDistribution.ts`, `typeDistributionRepository.ts`, scoped distribution spec | CI Run 240 (`33036572687`): domain + real snapshot aggregation integration | exact model/code/locale/time/sample only; `populationClaimAllowed=false`; public eligibility/min-sample policy pending |
| PCS-ANA-003 | blocked by design prerequisites | `CALIBRATION_EXPORT_SPEC_v0.1.md` | no runtime export intentionally exists | requires explicit calibration consent/governance before implementation |
| Phase 4B-3 retention/observability foundation | complete (development implementation) | versioned retention policy + cleanup repository/CLI + fixed error telemetry + bucketed Web Vitals + `/api/health` | Runs 269/270/272/273 | production scheduler, external monitoring/alerting and environment separation remain |
| PCS-OPS-003 | partial | client error/performance telemetry + DB readiness endpoint | Runs 269/272/273 | independently durable production monitoring and alerting remain open |
| PCS-QA-004 | complete through Phase 4A-1 journey | E2E path contract | Playwright Chromium flow | start → back/edit → 147 answers → private result → explicit public share → cookie-free view/cards → revoke/404 |
| PCS-QA-005..007 | pending | a11y/visual/security requirements | partial foundations only | later release gates |

## Requirement governance evidence

- `scripts/validate-requirement-ids.mjs` parses authoritative requirement declarations.
- Master IDs may be repeated only through a deliberately small explicit alias allowlist where the derivative meaning is intentionally shared.
- Unapproved Master shadowing, duplicate detailed IDs, or duplicate declarations within one file fail CI.
- Detailed documents use reserved `010+`/`020+` ranges when they add narrower clauses rather than redefining Master IDs.

This directly enforces the Master rule that requirement IDs are never reused for different meanings.

## Phase 2 persistence/application evidence

### Architecture/data

- `docs/adr/ADR-0001-persistence-postgresql-drizzle.md`
- `src/infrastructure/persistence/schema.ts`
- `src/infrastructure/persistence/database.ts`
- `src/infrastructure/persistence/sessionToken.ts`
- `src/infrastructure/persistence/anonymousAssessmentRepository.ts`
- `src/infrastructure/persistence/assessmentModelRepository.ts`
- `src/application/assessment/serverAssessmentService.ts`
- `src/server/assessmentRuntime.ts`
- `drizzle/0000_phase2b_persistence.sql`
- `drizzle/0001_phase2b_immutability_hardening.sql`
- `drizzle/0002_phase4a_public_share_snapshots.sql`
- `src/infrastructure/persistence/sharingSchema.ts`
- `src/infrastructure/persistence/publicShareToken.ts`
- `src/infrastructure/persistence/publicShareRepository.ts`
- `docs/model/PERSISTENCE_RETENTION_BASELINE_v0.1.md`

### Verification

- `scripts/validate-persistence-schema.mjs` validates the ordered migration contract and required guards.
- `tests/infrastructure/postgres-integration.mjs` applies migrations to a real PostgreSQL 16 database and proves DB invariants.
- `tests/infrastructure/anonymous-assessment-repository.integration.test.ts` proves hash-only anonymous credentials, answer persistence, atomic scores/snapshot/completion, private result lookup and post-completion freeze.
- `tests/application/server-assessment-service.integration.test.ts` executes the full 147-answer application flow against the seeded reviewed model.
- `tests/e2e/assessment-flow.spec.ts` proves the real Chromium web flow, back/edit behavior, deterministic result rendering/reload, private-result isolation, explicit sanitized public sharing, social controls, deterministic OG/portrait images and revocation.

## Phase 3A development catalog evidence

- `docs/model/TYPE_CATALOG_SPEC_v0.1-dev.md` defines the non-public catalog contract, claim provenance and adjacent-type differentiation rule.
- `data/type-catalog/v0.1-dev/reachability.json` explicitly freezes all 64 legal C01D combinations.
- `scripts/validate-type-catalog.mjs` derives the legal set from `data/code-schema/v0.1-dev.json`, checks exact 2^6 reachability/order, validates symbols and proves every code's six one-axis neighbors remain inside the catalog.
- Both source schema and draft catalog are required to stay `public_use=false` in this development validator.

This is engineering completeness evidence only. It does not complete the published Core Type catalog or validate a 64-type psychological taxonomy.

## Phase 4A sanitized sharing evidence

- Sanitized schema: `src/domain/sharing/shareSnapshot.ts`
- Public capability: `src/infrastructure/persistence/publicShareToken.ts` (256-bit token / SHA-256 DB hash)
- Lifecycle repository: `src/infrastructure/persistence/publicShareRepository.ts`
- DB table/guards: `src/infrastructure/persistence/sharingSchema.ts`, `drizzle/0002_phase4a_public_share_snapshots.sql`
- Explicit owner API/UI: `src/app/api/share/route.ts`, `src/app/result/ShareControls.tsx`
- Public route: `src/app/s/[token]/page.tsx`
- Versioned deterministic cards: `src/app/api/share/_image.tsx`, OG/portrait v0.1 routes
- Browser proof: CI Run `33020306036` (Run 190) covers share controls, cookie-free public view, PNG/card byte determinism, dynamic OG metadata and revoke→404 behavior.
- Production caveat: display-name/identity/illustration fields remain nullable until Phase 3A/3B/5C approval; PCS-SOC-001 remains open.

## Security baseline evidence

- Capability security: 256-bit anonymous/share tokens with hash-only persistence; HttpOnly/SameSite session cookie.
- Policy: `data/security/rate-limits-v0.1-dev.json`.
- Rate-limit persistence: `drizzle/0004_security_rate_limits.sql`, `src/infrastructure/persistence/securitySchema.ts`, `rateLimitRepository.ts`.
- Request enforcement: `src/server/rateLimit.ts`; assessment session/answer/complete, share mutation and analytics routes.
- Rate-limit principals are HMAC-SHA256 buckets; raw IP/private session token is not stored in the rate-limit table.
- Header baseline: `next.config.ts` (CSP, HSTS in production, DENY framing, nosniff, referrer and permissions policies).
- Machine validator: `scripts/validate-security-baseline.mjs`.
- Dependency gate: `npm audit --omit=dev --audit-level=high` in CI.
- E2E: `tests/e2e/security-headers.spec.ts`, `rate-limit.spec.ts`.
- DB integration: `tests/infrastructure/rate-limit-repository.integration.test.ts`.
- Evidence checkpoints: Run 304 (`33038326772`) privacy-safe 429/security-header/dependency suite; Run 307 security validator/audit; Run 309 latest full HEAD.
- Remaining release gates: trusted proxy/CDN configuration, TLS termination verification, production DB least privilege, deployment secret-store proof, final security/privacy checklist/penetration review.

## Phase 4B first-party analytics evidence

- Event contract: `data/analytics/event-dictionary-v0.1-dev.json`
- Runtime validator: `src/domain/analytics/productEvent.ts`
- First-party persistence: `src/infrastructure/persistence/analyticsRepository.ts`, `analyticsSchema.ts`, `drizzle/0003_phase4b_first_party_analytics.sql`
- Client transport: `src/app/api/analytics/route.ts`, `src/app/_analytics/client.ts`
- Funnel wiring: landing, assessment start/resume/question/answer state/completion/result/share/public-share routes
- Privacy baseline: `docs/model/ANALYTICS_PRIVACY_BASELINE_v0.1.md`
- Browser/network + persisted-row proof: CI Run `33036549731` (Run 238)
- Observed distribution domain/repository/spec: `observedTypeDistribution.ts`, `typeDistributionRepository.ts`, `OBSERVED_TYPE_DISTRIBUTION_SPEC_v0.1.md`
- Observed-distribution DB proof: CI Run `33036572687` (Run 240)
- Calibration design gate: `docs/model/CALIBRATION_EXPORT_SPEC_v0.1.md`; no raw-answer export is enabled.
- Retention policy: `data/analytics/retention-policy-v0.1-dev.json`
- Retention cleanup: `src/infrastructure/persistence/analyticsRetentionRepository.ts`, `scripts/cleanup-analytics-retention.mjs`
- Error boundaries/instrumentation: `src/app/error.tsx`, `src/app/global-error.tsx`, assessment/share client paths
- Web Vitals sanitizer: `src/domain/analytics/webVitals.ts`, `src/app/WebVitalsAnalytics.tsx`
- Readiness route: `src/app/api/health/route.ts`
- Operational/privacy evidence: Runs 269 (error telemetry), 270 (retention), 272 (health), 273 (API payload rejection).

The first-party product-event table is not a calibration dataset. Observed type distributions are computed from immutable result snapshots and explicitly prohibit population extrapolation.

## Current CI evidence

Current CI gates include:

1. requirement-ID integrity;
2. development type-catalog reachability;
3. reviewed Item Bank v0.2 validation;
4. persistence migration/static invariants;
5. real PostgreSQL persistence integration;
6. reviewed model seed + application integration;
7. domain/infrastructure + Golden Snapshot tests;
8. TypeScript typecheck;
9. production build;
10. Chromium 147-item private assessment + explicit sanitized public-share/card/revocation E2E.

The historical Phase 2C browser checkpoint is CI Run `32960309207`. Phase 4A sanitized sharing/card checkpoint is CI Run `33020306036` (Run 190). New validators remain release-blocking on every subsequent push/PR.

CI success verifies software/data-contract invariants only. It is not evidence of psychological construct validity.

## Status vocabulary

- **complete (policy):** governance definition is finished; later runtime controls may have separate requirements.
- **complete (conceptual):** current design artifact is sufficient for its phase, without empirical-validation implication.
- **complete (candidate authoring):** candidate artifact exists and is machine checked.
- **complete (editorial review):** every item has an explicit recorded wording/construct-purity disposition; beta evidence still pending.
- **complete (development engine/spec):** deterministic engineering contract/implementation exists but may be intentionally non-public/experimental.
- **complete (Phase 2B/2C foundation):** persistence/application invariants and real private web flow are implemented and tested; public-share/legal/release concerns remain later gates.
- **active draft foundation:** engineering reachability/schema contract exists while authored/public promotion remains incomplete.
- **complete:** requirement itself is fulfilled.
- **active invariant:** continuously enforced rule.
- **partial:** some clauses satisfied; checkbox remains open.
- **pending:** not yet implemented/completed.

## Update rule

Whenever a requirement becomes checked in `REQUIREMENTS.md`, this table must be updated in the same change set with exact evidence. Future phases add implementation paths/test IDs/release artifacts without deleting historical evidence.
