# Requirements Traceability Matrix

> Status: active from Phase 1 onward
> Last updated: 2026-08-27

A checkbox in `REQUIREMENTS.md` is marked complete only when inspectable specification/implementation/verification evidence exists. `complete` never implies psychometric validation unless the requirement explicitly concerns validation evidence.

| Requirement | Status | Specification / Evidence | Implementation | Verification |
| --- | --- | --- | --- | --- |
| PCS-GOV-001..010 | complete (policy/invariants) | `REQUIREMENTS.md`, `docs/requirements/00_GOVERNANCE.md` | deterministic domain/persistence/web boundaries; runtime AI prohibited | requirement-ID validator + CI/runtime architecture |
| PCS-PROD-001 | complete | `01_PRODUCT_SCOPE.md`, `LANDING_CLAIM_REVIEW_v0.1.md` | reviewed landing purpose/non-clinical/development boundaries + current C01D sample alignment | claim validator + Visual Baseline Run 8 + full CI Run 379 |
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
| PCS-SCORE-003 | advanced partial / activation gate enforced | model/revision metadata + release manifest + `PRODUCTION_MODEL_ACTIVATION_GATE_v0.1-dev.md` | exact assessment-dev-v0.3 tuple, immutable mappings, explicit migration/rollback/CI requirements; all production activation actions false | release-operations + model-activation validators + DB immutability | Phase 5/public schema/environment/editorial/art/accessibility/performance/legal/security/observability evidence still pending |
| PCS-SCORE-004 | complete (development engine) | `SCORING_SPEC_v0.1.md` | `scoring.ts`, `itemBank.ts` | scoring/candidate/reviewed-bank tests; exact integer bp normalization |
| PCS-SCORE-005 | complete (v0.1 baseline) | `SCORING_SPEC_v0.1.md` | `computeResponseQuality` | deterministic quality fixtures; metadata does not alter Trait Score |
| PCS-SCORE-006 | complete | Golden/manual scoring requirements | scoring/candidate/reviewed tests | min/mid/max, reverse keys, manual mixed, order invariance, invalid input |
| PCS-RESULT-001 | complete (experimental engineering spec) | `CORE_CODE_SPEC_v0.1-dev.md`, `data/code-schema/v0.1-dev.json` | `personalityCode.ts` | `personality-code.test.ts`; C01D `public_use=false` |
| PCS-RESULT-002 | complete (experimental engineering spec) | Core/Extended Code spec | `generatePersonalityCode`, `traitBandFromScoreBp` | exact boundaries/order/input invariance/missing+duplicate rejection |
| PCS-RESULT-003 | complete (development engine) | `04_CODE_AND_RESULT_ENGINE.md`, versioned content/rule data | `interactions.ts`, `contentComposer.ts`, `resultEngine.ts` | interaction + composer + result-engine tests |
| PCS-RESULT-004 | complete (development engine) | precedence/assertion/suppression contract | `contentComposer.ts` | disciplined-optimizer, deep-non-fused, inactive-generic and fallback contradiction fixtures |
| PCS-RESULT-005 | complete | result snapshot + retention/asset-lineage contract | historical v0.1 + new `result-snapshot-v0.2-dev`; exact displayed illustration asset version persisted; DB requires known asset and source/share equality | domain/repository/PostgreSQL + full CI Run 432 | type-specific artwork remains ART-002, not snapshot reproducibility |
| PCS-CONTENT-001 | advanced draft / public promotion blocked | 64-entry editorial catalog + review gate + deterministic review worklist | exact reachable-code coverage, required fields/provenance/neighbor notes, per-type human approval ledger and 64 complete reviewer packets | catalog + editorial-review gate/worklist validators | C01D/catalog public_use=false; actual human approvals and Phase 5C public schema remain |
| PCS-CONTENT-002 | advanced draft / human QA pending | content v0.3 + 18-domain result contract + 64-type reviewer worklist | every required result domain resolves in development; each draft type exposes all long-form fields/provenance to human review | result snapshot/application tests + worklist validator | final Japanese human editorial approval remains |
| PCS-CONTENT-003 | advanced draft / human QA pending | adversarial rules + 64-entry draft catalog + reviewer worklist | provenance/limitation-safe adversarial copy; insults/diagnoses/certainty patterns blocked; adversarial-tone review is explicit per packet | editorial catalog/worklist validators | final human adversarial editorial approval remains |
| PCS-ART-001 | complete (art-direction foundation) | `ILLUSTRATION_SYSTEM.md`, illustration system data | coherent 8×4×2 motif/composition grammar, static versioned asset contract | illustration slot validator |
| PCS-ART-002 | pending real assets / production ingest mechanics complete | 64 briefs + `asset-production-registry.json` + ingest contract | exact asset IDs; committed master/variant SHA-256; actual PNG/WebP/SVG byte dimensions; provenance; source-master lineage; nine human review checks required for approval | illustration validators + image-metadata parser tests | all 64 C01D type heroes remain `unproduced`; owner art-direction/public schema gates remain |
| PCS-ART-003 | complete (current runtime artwork contract) | illustration system + fallback asset manifest | repository-authored static `ILL-PCS-FALLBACK-HERO-v01` used on result/share/cards; exact version frozen in snapshots; runtime generation false | illustration validator + Visual Baseline Run 9 + CI Run 432 | 64 type-specific heroes remain ART-002 |
| PCS-FE-003 | complete (Phase 2C development UX) | `06_FRONTEND_RESPONSIVE_UX.md` | real 147-item assessment UI | Chromium start/save/back/edit/complete flow |
| PCS-FE-004 | complete (Phase 2C development UX) | structured result hierarchy | real private result page | Chromium Core/Extended/Traits/18-section/reload assertions |
| PCS-FE-005 | complete (current application responsive QA) | required width matrix + `RESPONSIVE_ACCESSIBILITY_QA_v0.1.md` | functional landing/assessment/result width checks + horizontal-overflow assertions | CI Run 329 (`33044207630`): 320/390/768/1024/1280/1440 | screenshot-diff visual regression remains PCS-QA-006 |
| PCS-A11Y-001 | complete (keyboard core flow) | `06_FRONTEND_RESPONSIVE_UX.md`, responsive/accessibility QA record | actual Tab/Shift+Tab/Space/Enter focus traversal through 147 answers + finalization | CI Run 329 (`33044207630`) | no pointer/touch activation used by the completion test |
| PCS-A11Y-002 | advanced partial / human evidence gate explicit | semantics + automated accessibility evidence + `MANUAL_ACCESSIBILITY_RELEASE_QA_v0.1.md` + machine review record | axe/keyboard/touch/reduced-motion/200%-scale/visual coverage; manual flow now includes share and destructive self-deletion | `validate:a11y-release` requires all real AT/device executions to remain pending until performed | real screen-reader, browser/mobile scaling, final artwork/public-copy review remain |
| PCS-PERF-001 | advanced partial / lab baseline green | `PERFORMANCE_BUDGET_SPEC_v0.1.md`, build budgets, lab profile/evidence | build artifact audit + dedicated desktop/constrained-mobile four-surface lab harness | Performance Lab Run 1 (`33068786639`) success: observed LCP/CLS and scripted interaction Event Timing proxies within current good thresholds | field p75 CWV and production release review still required before closure |
| PCS-ARCH-001 | complete | `07_APPLICATION_ARCHITECTURE_AND_DATA.md` | `src/domain/assessment/*` isolated from React/DB | compile/tests independent of UI/database |
| PCS-ARCH-002 | complete (Phase 2B/2C foundation) | ADR-0001 + schema/application contract | schema, adapters, real server/application wiring | static migration validator + PostgreSQL 16 + application integration |
| PCS-ARCH-003 | complete | raw-answer/public-export separation contract | `shareSnapshot.ts`, hash-only public token/repository, DB insert guard, versioned public image routes | domain + PostgreSQL + repository + Chromium public/private boundary tests |
| PCS-ARCH-004 | complete (current persistence) | immutability contract | SQL triggers protect published model/items/content/revisions/snapshots | `postgres-integration.mjs` exercises actual rejection behavior |
| PCS-ARCH-005 | complete (foundation) | ADR-0001 migration/rollback policy | ordered committed SQL migrations | migration validator + PostgreSQL application in CI; deployment backup rehearsal is OPS |
| PCS-PRIV-001 | complete (anonymous private flow) | `08_PRIVACY_SECURITY.md` | opaque token + hash-only DB + HttpOnly/SameSite cookie | repository tests + fresh-browser private-result isolation |
| PCS-PRIV-002 | complete (development implementation) | `08_PRIVACY_SECURITY.md`, `DATA_MINIMIZATION_SPEC_v0.1.md`, `data-inventory-v0.1-dev.json` | seven-class exact table inventory + default collection prohibitions + `validate-privacy-data-inventory.mjs` | CI Run 373 (`33050505946`) privacy-data gate + full-head green | public legal wording/consent remains PCS-LEGAL-001; future collection must pass the change gate |
| PCS-PRIV-003 | complete (development implementation) | first-party-only analytics privacy contract | allowlisted network/DB event payloads; third-party export disabled; raw answer/Trait vector bans | CI Run 238 + Run 273 | deployed provider/log audit remains release QA |
| PCS-PRIV-004 | complete (development share flow) | opt-in public-share policy | POST `/api/share` requires private bearer cookie and explicit UI action | Chromium explicit-share flow + separate public snapshot persistence |
| PCS-SEC-001 | complete (development implementation) | `08_PRIVACY_SECURITY.md`, `rate-limits-v0.1-dev`, security-header/release-hardening baseline | opaque/hash-only capabilities, server validation, HMAC DB-backed rate limits, privacy-safe 429s, CSP/HSTS/frame/nosniff/referrer/permissions headers, release static/runtime-boundary audit, post-build leakage audit, cross-site mutation guard | CI Run 304 (`33038326772`) earlier rate-limit/security baseline + Run 373 (`33050505946`) current full-head security/privacy suite | deployment TLS/trusted proxy/DB least privilege/secret store/final QA remain OPS/QA gates |
| PCS-QA-001 | complete (current CI) | `10_TESTING_QA.md` | `.github/workflows/ci.yml` | production dependency + release-security audits → requirements/type/content/item/analytics/privacy/security/persistence validators → PostgreSQL/app/domain/retention → typecheck/build → client-artifact leakage audit → Chromium E2E |
| PCS-QA-002 | complete (current domain pipeline) | result/scoring/code requirements | full current domain engine | scoring/code/interaction/composer/result/snapshot suites |
| PCS-QA-003 | complete (development fixture) | Golden snapshot rule | `golden-result-snapshot-midpoint-v0.1.json` | exact equality + answer-order invariance tests |
| PCS-SOC-001 | complete (development implementation) | `09_SOCIAL_SHARING_AND_ANALYTICS.md`, fallback asset manifest | deterministic OG/portrait images consume sanitized stored snapshot + exact curated asset version | byte-identical E2E, asset response header, DB source/share lineage, Visual Baseline Run 9, CI Run 432 |
| PCS-SOC-002 | complete (development implementation) | `09_SOCIAL_SHARING_AND_ANALYTICS.md` | Web Share, X intent, LINE intent, URL copy on private result | Chromium assertions against exact opaque share URL |
| PCS-SOC-003 | complete (development fallback) | versioned sanitized OG contract | dynamic share metadata + `/api/share/og/v0.1/[token]` | Run 190: image/png, template header, byte determinism, revoked 404 |
| PCS-LEGAL-001 | advanced implementation-grounded public drafts / legal approval pending | `/privacy`, `/terms`, legal disclosure + self-deletion + retention + backup contracts | browser-visible PRE-LAUNCH drafts cover medical/non-validation/share/deletion/retention/backup/calibration boundaries and explicitly noindex | legal validator + legal-disclosure E2E + retention/backup PostgreSQL evidence | final jurisdiction/operator/contact/consent wording, deletion replay/provider behavior and legal approval remain |
| PCS-PRIV-003 / PCS-ANA-001 | complete (development implementation) | `event-dictionary-v0.1-dev`, `/api/analytics`, server/client funnel wiring, `product_events` | CI Run 238 (`33036549731`): Chromium network payload + DB assertions | first-party only; answer values/Trait vectors/private tokens are prohibited and third-party export defaults off |
| PCS-ANA-002 | advanced partial / public data gate pending | observed distribution + publication policy specs | exact immutable-snapshot aggregation; published/public-schema gate; min scope/cell thresholds; scoped display formatter; population claims false | DB aggregation integration + publication policy/domain tests | production public model, real qualifying sample and final privacy review remain |
| PCS-ANA-003 | blocked runtime path / pre-collection protocol complete | `CALIBRATION_EXPORT_SPEC_v0.1.md`, `BETA_CALIBRATION_PROTOCOL_v0.1.md`, beta protocol manifest | no runtime export intentionally exists; collection/export flags remain false | calibration protocol validator | explicit consent/legal/environment separation/operator authorization still required before implementation |
| Diagnostic retention foundation | complete (development implementation) | `diagnostic-retention-v0.1-dev`, `PERSISTENCE_RETENTION_BASELINE_v0.1.md` | dry-run/explicit-ack cleanup + DB 90-day completed-answer guard + 30/90/180 behavior | PostgreSQL diagnostic-retention integration + static validator + CI dry-run | production scheduler and backup restore behavior remain external/legal gates |
| Phase 4B-3 retention/observability foundation | complete (development implementation) | versioned analytics + diagnostic retention policies, cleanup CLIs, fixed telemetry, health/observability contracts | analytics/rate-limit cleanup plus 30/90/180 diagnostic cleanup; fixed error telemetry; bucketed Web Vitals; DB readiness | PostgreSQL retention integrations + CI dry-runs + observability validator | production schedulers, independent monitoring/alerting and environment separation remain |
| Phase 5A planning | protocol foundation complete / collection not started | `BETA_CALIBRATION_PROTOCOL_v0.1.md`, `beta-protocol-v0.1-dev.json` | no collection path; analysis/prerequisite/change-control bundle frozen | calibration protocol validator | consent/legal/environment/sample-plan activation prerequisites remain |
| PCS-OPS-001 | advanced repository/runtime contract + executable probe / deployed separation pending | environment contract + deployment/launch gate + `DEPLOYMENT_PROBE_v0.1.md` | explicit environment/origin classes; provider-independent HTTPS/health/security-header/robots/noindex probe | environment/runtime/launch validators + deployment-probe unit tests + Container Package/full CI | actual distinct preview/production identities/databases/domain/TLS still external |
| PCS-OPS-002 | advanced repository contract / secret-store evidence pending | environment/runtime package contracts + blank-secret `.env.example` + release-security audits | server-only required vars, no AI runtime keys, no committed example secrets, explicit deployment/client-IP config, non-root standalone package, dependency update automation | environment + release-security + build/runtime validators | deployed secret store, access policy and rotation evidence remain external |
| PCS-OPS-003 | advanced repository foundation + live-probe tooling / independent monitoring pending | observability contract/runbook + fixed-schema logs + health + deployment probe | privacy-safe readiness/telemetry plus provider-independent HTTP evidence for health/security/crawler state | observability/log validators + deployment-probe tests + health/browser evidence | actual provider/probe scheduling, alert routing, deployment correlation and incident drill remain external |
| PCS-OPS-004 | complete (repository-level rollback documentation) | `ROLLBACK_RUNBOOK_v0.1.md`, release policy | separate app/DB/model/content/asset/share-template rollback, forward-fix DB default, affected-result handling | CI Run 383 release-operations validator | provider-specific commands/restore rehearsal remain OPS-001/002/006 adjacent evidence |
| PCS-OPS-005 | advanced repository freeze/evidence process / production activation pending | release/activation contracts + post-E2E `release-candidate-evidence.json` | exact Git SHA, Requirements version, model tuple, critical-file hashes, ordered migration-set hash, art/evidence gate state frozen only after full E2E | release/evidence validators + normal CI artifact | actual Phase 5C model/public schema freeze and production activation evidence remain |
| PCS-OPS-006 | fail-closed runtime gate + canonical evidence governance / launch blocked | public launch gate + production activation gate + `production-evidence-registry-v0.1-dev` | 16 canonical external/manual/research/release records exactly bind all gate keys; unsupported completion without artifact/time/reviewer/environment/notes fails CI | launch/runtime/evidence validators + domain/browser tests + full CI | all production/manual evidence still pending; launch cannot close |
| PCS-QA-004 | complete through Phase 4A-1 journey | E2E path contract | Playwright Chromium flow | start → back/edit → 147 answers → private result → explicit public share → cookie-free view/cards → revoke/404 |
| PCS-QA-005 | advanced partial | automated axe + keyboard/touch/mobile + 200% scaling evidence; manual AT release record defined | `responsive-accessibility.spec.ts`, `MANUAL_ACCESSIBILITY_RELEASE_QA_v0.1.md` | current CI after large-text test | human assistive-tech/real zoom walkthrough remains NOT RUN |
| PCS-QA-006 | complete (current development application) | `visual-regression.spec.ts` + 16 committed Linux/Chromium baselines + controlled update workflow | normal CI comparison mode; Runs 343/344 green | landing/assessment six widths + result/public-share 390/1440; baseline updates require review |
| PCS-QA-007 | advanced automated threat/security foundation / external review gate open | security/privacy QA + `threat-model-v0.1-dev` + production evidence registry | 16 trust-boundary threats with mitigations/tests/residuals; every partial-external threat binds a canonical production evidence ID | threat-model + release-security + DB-role + backup/log/privacy validators/integrations + full CI | external security review and real production edge/roles/TLS/secrets/logs/backup/deletion-replay remain |

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

## Phase 4A sanitized sharing + curated artwork evidence

- Sanitized schema: `src/domain/sharing/shareSnapshot.ts`
- Public capability: `src/infrastructure/persistence/publicShareToken.ts` (256-bit token / SHA-256 DB hash)
- Lifecycle repository: `src/infrastructure/persistence/publicShareRepository.ts`
- DB table/guards: `src/infrastructure/persistence/sharingSchema.ts`, `drizzle/0002_phase4a_public_share_snapshots.sql`
- Explicit owner API/UI: `src/app/api/share/route.ts`, `src/app/result/ShareControls.tsx`
- Public route: `src/app/s/[token]/page.tsx`
- Versioned deterministic cards: `src/app/api/share/_image.tsx`, OG/portrait v0.1 routes
- Browser proof: CI Run `33020306036` (Run 190) covers share controls, cookie-free public view, PNG/card byte determinism, dynamic OG metadata and revoke→404 behavior.
- Public taxonomy caveat: display-name/identity remain nullable until Phase 3A/5C approval. New shares do freeze the current curated fallback illustration asset; type-specific heroes remain Phase 3B / PCS-ART-002.

## Responsive and accessibility evidence

- Functional width matrix: 320×844, 390×844, 768×1024, 1024×768, 1280×800, 1440×900.
- Test: `tests/e2e/responsive-accessibility.spec.ts`.
- Evidence record: `docs/reviews/RESPONSIVE_ACCESSIBILITY_QA_v0.1.md`.
- Landing/assessment and completed private result are exercised without document-level horizontal overflow at all mandatory widths.
- The assessment is completed through all 147 questions using actual keyboard focus traversal with `Tab`, `Shift+Tab`, `Space`, and `Enter`.
- Touch-enabled 390px mobile interaction is exercised.
- Accessibility semantics include progressbar/radiogroup/error relationships and result Trait meters.
- `@axe-core/playwright` WCAG A/AA scans are release-blocking in current E2E; detected contrast defects were fixed rather than excluded.
- Focus-visible, reduced-motion and practical assessment target-size assertions are included.
- Successful checkpoint: CI Run 329 (`33044207630`).
- Remaining: real assistive-technology/text-zoom manual review and screenshot-diff visual regression.

## Visual regression evidence

- Test: `tests/e2e/visual-regression.spec.ts`
- Baselines: `tests/e2e/visual-regression.spec.ts-snapshots/` (16 PNGs)
- Controlled update workflow: `.github/workflows/visual-baseline.yml`
- Review policy: `docs/reviews/VISUAL_REGRESSION_QA_v0.1.md`
- Dependency reproducibility: committed `package-lock.json`; normal/visual jobs use `npm ci`.
- Baseline scope: landing + assessment at 320/390/768/1024/1280/1440; completed private result + sanitized public share at 390/1440.
- Normal CI sets `PCS_VISUAL_REGRESSION=1` and compares without `--update-snapshots`.
- Evidence: CI Run 343 (`33047133202`) and Run 344 (`33047140525`) passed the committed baseline comparison; Visual Baseline Run 7 reproduced the same snapshots from the lockfile.

## Security baseline evidence

- Capability security: 256-bit anonymous/share tokens with hash-only persistence; HttpOnly/SameSite session cookie.
- Policy: `data/security/rate-limits-v0.1-dev.json`.
- Rate-limit persistence: `drizzle/0004_security_rate_limits.sql`, `src/infrastructure/persistence/securitySchema.ts`, `rateLimitRepository.ts`.
- Request enforcement: `src/server/rateLimit.ts`; assessment session/answer/complete, share mutation and analytics routes.
- Rate-limit principals are HMAC-SHA256 buckets; raw IP/private session token is not stored in the rate-limit table.
- Header baseline: `next.config.ts` (CSP, HSTS in production, DENY framing, nosniff, referrer and permissions policies).
- Machine validator: `scripts/validate-security-baseline.mjs`.
- Dependency gate: `npm audit --omit=dev --audit-level=high` in CI.
- Release static audit: `scripts/validate-release-security.mjs` checks runtime AI/dependency boundaries, sensitive public env names, obvious committed secrets, unsafe dynamic HTML/code execution, Client Component server-env references, and required Next.js hardening.
- Production client-artifact audit: `scripts/audit-production-build.mjs` checks `.next/static` for source maps and server-only/configured secret identifiers or values.
- Cross-site mutation guard: `src/server/requestSecurity.ts` plus `tests/e2e/csrf-origin.spec.ts` rejects hostile Origin/Fetch Metadata writes before persistence/rate-limit consumption and verifies privacy-safe 403 responses.
- E2E: `tests/e2e/security-headers.spec.ts`, `rate-limit.spec.ts`, `csrf-origin.spec.ts`.
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

The historical Phase 2C browser checkpoint is CI Run `32960309207`. Phase 4A sanitized sharing baseline is CI Run `33020306036` (Run 190). Curated artwork/result-share visual baselines are frozen by Visual Baseline Run 9, and the current asset-lineage/full-browser completion checkpoint is CI Run `33062695051` (Run 432). Security/privacy release validators remain release-blocking on every subsequent push/PR.

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


## Anonymous diagnostic self-deletion evidence

- Contract: `data/privacy/user-deletion-v0.1-dev.json`.
- API/UI: `DELETE /api/assessment/data`, private Result `DataControls`, two-step irreversible confirmation and successful cookie clearing.
- Persistence: `anonymousDataDeletionRepository.ts` deletes source-derived public shares first, then the owning anonymous session; FK cascades remove answers, Trait Scores, private result and session-bound product events.
- DB safety: migration `0006_privacy_delete_cascade_guards.sql` allows only parent-session cascade deletion while direct completed answer/Trait-score deletion remains rejected.
- Security: dedicated session-bound HMAC rate-limit and trusted-origin/Fetch Metadata guard; hostile-origin browser test includes DELETE.
- Public legal status remains open because scheduler, backup restore behavior, contact/consent and jurisdictional review require production/legal evidence.
