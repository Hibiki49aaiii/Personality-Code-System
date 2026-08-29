# Personality Code System — Master Requirements & Delivery Checklist

> Status: authoritative development contract
> Version: 0.11.7
> Last updated: 2026-08-29

This file is the single top-level source of truth for PCS scope and delivery status. Detailed requirements live under `docs/requirements/`.

## 0. Requirement precedence

When documents conflict, use this order:

1. `REQUIREMENTS.md` — product invariants, scope, delivery gates.
2. `docs/requirements/*.md` — authoritative domain requirements.
3. `docs/PRODUCT_SPEC.md`, `docs/DESIGN_SYSTEM.md`, `docs/DIAGNOSTIC_MODEL.md`, `docs/model/*` — versioned design/research/model specifications subject to levels 1–2.
4. Implementation notes, issues, comments, prototypes.

A lower-priority document MUST NOT silently override a higher-priority one. Intentional requirement changes update every affected authoritative document in the same change set. Requirement IDs MUST NOT be reused for different meanings.

## 1. Non-negotiable product invariants

- [x] **PCS-GOV-001** User-facing diagnosis is deterministic and reproducible for a fixed assessment/model/content version set.
- [x] **PCS-GOV-002** No AI/LLM/generative model is used at runtime to score, classify, write, rewrite, personalize, or decide user-facing diagnostic results.
- [x] **PCS-GOV-003** AI may be used only as development tooling outside shipped runtime; production requires no AI API key/service.
- [x] **PCS-GOV-004** Same complete answer set + same versions = same Trait Scores, code, module selection, and result snapshot.
- [x] **PCS-GOV-005** Published models/results are immutable; revisions create explicit versions.
- [x] **PCS-GOV-006** PCS does not claim scientific validation before documented evidence gates are satisfied.
- [x] **PCS-GOV-007** Population rarity is never fabricated from theoretical combinations; only scoped observed sample distributions may be shown.
- [x] **PCS-GOV-008** Product must not present itself visually/verbally as an “AI personality diagnosis” service.
- [x] **PCS-GOV-009** Web UI is intentionally usable on PC and smartphone, not merely scaled down.
- [x] **PCS-GOV-010** Core diagnosis/result remains understandable without an account or social sharing.

Detailed governance: [`docs/requirements/00_GOVERNANCE.md`](docs/requirements/00_GOVERNANCE.md)

## 2. Product scope

- [x] **PCS-PROD-001** Public landing page clearly explains what PCS measures and does not claim. *(Landing copy now states continuous multi-Trait measurement, explicit non-clinical and development/not-validated boundaries, removes obsolete/finalized-64-type presentation, and CI blocks unsupported scientific/accuracy/population claims. Updated visual baselines are committed; CI Run 379 passed the full application after the claim-review fixes.)*
- [x] **PCS-PROD-002** Assessment can start without registration. *(Anonymous HttpOnly bearer-cookie flow implemented and browser-tested.)*
- [x] **PCS-PROD-003** User can complete a real assessment and receive a real result. *(Reviewed 147-item development model; production calibration remains later.)*
- [x] **PCS-PROD-004** Result includes Core Type/Code, Extended Code, Trait summary, confidence metadata, and narrative domains. *(Current content is development-versioned, not final editorial copy.)*
- [x] **PCS-PROD-005** Result includes strengths and adversarial/failure-mode analysis. *(Current deterministic development content provides both; human production editorial approval remains Phase 3.)*
- [x] **PCS-PROD-006** Result includes dedicated relationships/love, work, and stress sections. *(Structured domains are rendered from versioned modules.)*
- [x] **PCS-PROD-007** Public saving/sharing occurs only through explicit user action. *(Private completion remains non-public; POST `/api/share` creates a separate sanitized public snapshot only after the user invokes Share.)*
- [x] **PCS-PROD-008** Compatibility is excluded from MVP until its own deterministic/versioned specification exists.

Detailed scope: [`docs/requirements/01_PRODUCT_SCOPE.md`](docs/requirements/01_PRODUCT_SCOPE.md)

## 3. Diagnostic model

- [x] **PCS-DIAG-001** Trait Dictionary v0.2: definitions, poles, inclusion/exclusion boundaries, 10/30/50/70/90 anchors. *(Conceptual/item-authoring freeze, not validation.)*
- [x] **PCS-DIAG-002** Pairwise overlap audit completed; unjustified redundancy removed/narrowed. *(Empirical discriminant review remains Phase 5.)*
- [x] **PCS-DIAG-003** Presentation domains defined separately from measured/latent constructs.
- [x] **PCS-DIAG-004** Versioned interaction hypotheses, thresholds, precedence, and suppression implications specified.
- [x] **PCS-DIAG-005** Required evidence gates defined before `validated` language may be used.

Current direct Trait set: 21. LDR/DEL/TRN are derived profiles rather than direct 0–100 measurements.

Model artifacts:

- [`docs/model/TRAIT_DICTIONARY_v0.2.md`](docs/model/TRAIT_DICTIONARY_v0.2.md)
- [`docs/model/TRAIT_OVERLAP_MATRIX_v0.2.md`](docs/model/TRAIT_OVERLAP_MATRIX_v0.2.md)
- [`docs/model/TRAIT_INTERACTIONS_v0.1.md`](docs/model/TRAIT_INTERACTIONS_v0.1.md)
- [`docs/model/VALIDATION_GATES_v0.1.md`](docs/model/VALIDATION_GATES_v0.1.md)

Detailed requirements: [`docs/requirements/02_DIAGNOSTIC_MODEL.md`](docs/requirements/02_DIAGNOSTIC_MODEL.md)

## 4. Question bank and scoring

- [x] **PCS-SCORE-001** 6–8 candidate items authored per retained Trait. *(147 = 21 × 7.)*
- [x] **PCS-SCORE-002** Complete per-item wording/construct-purity review recorded. *(98 accept-r1 / 39 revise-r2 / 10 hold-for-beta.)*
- [ ] **PCS-SCORE-003** Every item/scoring key is versioned through a formal production active-model release/freeze lifecycle. *(Exact model/revision metadata, DB immutability, beta release manifest and a fail-closed production activation gate now enforce the lifecycle mechanically. Current candidate activation remains false until Phase 5/public schema/environment/editorial/art/accessibility/performance/legal/security/observability evidence is complete.)*
- [x] **PCS-SCORE-004** Deterministic normalized Trait scoring implemented. *(Canonical integer `score_bp` 0..10000.)*
- [x] **PCS-SCORE-005** Deterministic response-quality metadata baseline implemented separately from Trait Scores; it does not label deception.
- [x] **PCS-SCORE-006** Golden/manual fixtures and input/order invariance tests prove exact current-layer reproducibility.

Current bank/model artifacts:

- `data/item-bank/v0.1/*` — immutable authoring snapshot;
- `data/item-bank/v0.2/*` — reviewed materialization ledger;
- [`docs/model/ITEM_BANK_REVIEW_v0.2.md`](docs/model/ITEM_BANK_REVIEW_v0.2.md);
- [`docs/model/SCORING_SPEC_v0.1.md`](docs/model/SCORING_SPEC_v0.1.md);
- `src/domain/assessment/scoring.ts`;
- `src/domain/assessment/reviewedItemBank.ts`.

Detailed requirements: [`docs/requirements/03_ITEM_BANK_AND_SCORING.md`](docs/requirements/03_ITEM_BANK_AND_SCORING.md)

## 5. Personality Code and result engine

- [x] **PCS-RESULT-001** Core Code dimensions/rules specified and implemented as a versioned deterministic **experimental engineering schema**. `C01D` remains `public_use=false` pending beta evidence.
- [x] **PCS-RESULT-002** Extended Code syntax/order/bands/version behavior specified and implemented (`PCSX1`) as an experimental engineering format.
- [x] **PCS-RESULT-003** Deterministic content-module selection implemented from versioned structured diagnostic output.
- [x] **PCS-RESULT-004** Contradiction-prevention/precedence/suppression implemented and fixture-tested.
- [x] **PCS-RESULT-005** Immutable result snapshots persisted with all required model/content/asset versions. *(New completions use `result-snapshot-v0.2-dev`, freezing the exact versioned illustration asset shown with the result; historical v0.1 snapshots remain readable. PostgreSQL rejects unknown/missing v0.2 assets and public shares cannot substitute a different asset version. Full CI Run 432 is green.)*

Current development Core anchors: SYS, VER, AUT, EXE, NOV, RDP. They are direct measured Trait anchors, not claimed latent factors. The 64 theoretical combinations are a compression consequence, not a claim that the measurement model was designed around 64 types.

Current result-engine artifacts:

- [`docs/model/CORE_CODE_SPEC_v0.1-dev.md`](docs/model/CORE_CODE_SPEC_v0.1-dev);
- `data/code-schema/v0.1-dev.json`;
- `data/interactions/v0.1.json`;
- `data/content/dev-v0.1.json`;
- `src/domain/assessment/personalityCode.ts`;
- `src/domain/assessment/interactions.ts`;
- `src/domain/assessment/contentComposer.ts`;
- `src/domain/assessment/resultEngine.ts`;
- `src/domain/assessment/resultSnapshot.ts`;
- `tests/fixtures/golden-result-snapshot-midpoint-v0.1.json`.

Detailed requirements: [`docs/requirements/04_CODE_AND_RESULT_ENGINE.md`](docs/requirements/04_CODE_AND_RESULT_ENGINE.md)

## 6. Type content and illustrations

- [ ] **PCS-CONTENT-001** Versioned published Core Type catalog exists for every reachable public code. *(All 64 reachable C01D draft entries are now complete and an explicit per-type human editorial review/publication gate tracks approval. C01D and the catalog remain `public_use=false`; final public schema + approved catalog remain open.)*
- [ ] **PCS-CONTENT-002** Editorial content modules cover every required result domain. *(Development v0.3 resolves all 18 required result domains without selected fallback-only modules; final Japanese human editorial approval is tracked per type and remains pending.)*
- [ ] **PCS-CONTENT-003** Adversarial analysis modules describe failure modes without insults/diagnoses/deterministic certainty. *(All 64 development type entries contain limitation/provenance-checked adversarial copy and prohibited-language validation; final human adversarial-tone approval remains pending.)*
- [x] **PCS-ART-001** Single coherent illustration art direction defined. *(64-slot non-AI runtime art system and validator exist; actual hero assets remain unproduced.)*
- [ ] **PCS-ART-002** One curated hero illustration per published Core Type. *(64/64 exact development asset IDs now have production briefs plus a machine asset registry. Any produced/approved entry must reference committed bytes with SHA-256, byte-verified dimensions, provenance, deterministic source-master-linked variants and all human review checks. All C01D type-specific heroes remain `unproduced`; no artwork is fabricated or counted complete.)*
- [x] **PCS-ART-003** Runtime image generation prohibited; result artwork uses curated versioned assets. *(Private/public result surfaces and deterministic share cards use repository-authored `ILL-PCS-FALLBACK-HERO-v01`, frozen by version into immutable result/share snapshots; runtime generative illustration remains prohibited. This does not complete PCS-ART-002: the 64 type-specific heroes are still unproduced.)*

Current Phase 3A development artifacts:

- `docs/model/TYPE_CATALOG_SPEC_v0.1-dev.md` — draft catalog/publication/provenance contract;
- `data/type-catalog/v0.1-dev/reachability.json` — exact 64-code C01D reachability manifest;
- `scripts/validate-type-catalog.mjs` — 2^6 reachability/symbol/order/neighbor/public-use invariant validator.

These artifacts are deliberately `public_use=false` and do not complete `PCS-CONTENT-001`.

Detailed requirements: [`docs/requirements/05_CONTENT_AND_ILLUSTRATION.md`](docs/requirements/05_CONTENT_AND_ILLUSTRATION.md)

## 7. Frontend, responsive UX, accessibility

- [x] **PCS-FE-001** Next.js App Router + React + TypeScript foundation exists.
- [x] **PCS-FE-002** Initial responsive non-AI visual system exists.
- [x] **PCS-FE-003** Assessment UX implemented against reviewed/active real item model. *(147 reviewed items, save/resume/back/edit, browser E2E.)*
- [x] **PCS-FE-004** Result dossier UX implemented against real structured result schema. *(21 Traits + Core/Extended Code + 18 versioned sections + method metadata.)*
- [x] **PCS-FE-005** Layouts verified at 320, 375/390, 768, 1024, 1280, 1440+ CSS px. *(Chromium functional QA covers 320/390/768/1024/1280/1440 widths for landing/assessment and the completed private result, with document-level horizontal-overflow assertions; CI Run 329 / `33044207630`.)*
- [x] **PCS-A11Y-001** Keyboard-only assessment completion works. *(Chromium completes all 147 questions and finalization using actual `Tab` / `Shift+Tab` / `Space` / `Enter` traversal only; CI Run 329 / `33044207630`.)*
- [ ] **PCS-A11Y-002** Screen-reader, zoom/text scaling, reduced-motion, touch and final content/artwork accessibility pass release QA. *(Automated keyboard/axe/touch/reduced-motion/200%-scale evidence is green and a machine-readable fail-closed manual release record now covers desktop/mobile screen readers, browser scaling, share/revoke and destructive data deletion. Real NVDA/VoiceOver/TalkBack/device execution and final art/public-copy review remain required.)*
- [ ] **PCS-PERF-001** Public pages meet defined performance budgets/acceptable Core Web Vitals. *(Production artifact budgets are CI-enforced. Performance Lab Run 1 now covers landing/assessment/private-result/public-share on desktop and constrained mobile profiles with LCP/CLS plus scripted Event Timing interaction proxies; all frozen lab observations are within the current good thresholds. Field p75 CWV/release review still remains before closure.)*

Detailed requirements: [`docs/requirements/06_FRONTEND_RESPONSIVE_UX.md`](docs/requirements/06_FRONTEND_RESPONSIVE_UX.md)

## 8. Application architecture and data

- [x] **PCS-ARCH-001** Diagnostic domain logic is framework-independent and separately testable from UI/database.
- [x] **PCS-ARCH-002** Database schema supports anonymous sessions, model versions, items/revisions, answers, scores, snapshots, content, and asset references.
- [x] **PCS-ARCH-003** Raw answers never embedded into public URLs/social cards. *(Public share uses a separate sanitized snapshot; DB guards reject answers, Trait Scores, Response Quality, Extended/private result structures, and raw public capability tokens are hash-only in storage.)*
- [x] **PCS-ARCH-004** Published model/content and retained result snapshots are immutable/auditable in persistence. *(PostgreSQL triggers + real integration tests.)*
- [x] **PCS-ARCH-005** Database migrations/rollback procedure defined before production persistence. *(ADR + ordered committed migrations + validator + PostgreSQL CI; deployment recovery rehearsal remains OPS work.)*

Persistence artifacts:

- `docs/adr/ADR-0001-persistence-postgresql-drizzle.md`;
- `drizzle/0000_phase2b_persistence.sql`;
- `drizzle/0001_phase2b_immutability_hardening.sql`;
- `drizzle/0002_phase4a_public_share_snapshots.sql`;
- `src/infrastructure/persistence/schema.ts`;
- `src/infrastructure/persistence/sharingSchema.ts`;
- `src/infrastructure/persistence/sessionToken.ts`;
- `src/infrastructure/persistence/database.ts`;
- `src/infrastructure/persistence/anonymousAssessmentRepository.ts`;
- `src/infrastructure/persistence/publicShareToken.ts`;
- `src/infrastructure/persistence/publicShareRepository.ts`;
- `docs/model/PERSISTENCE_RETENTION_BASELINE_v0.1.md`.

Detailed requirements: [`docs/requirements/07_APPLICATION_ARCHITECTURE_AND_DATA.md`](docs/requirements/07_APPLICATION_ARCHITECTURE_AND_DATA.md)

## 9. Privacy and security

- [x] **PCS-PRIV-001** Anonymous assessment default in real web flow. *(No account; opaque 256-bit token stored only as hash server-side; browser carries HttpOnly/SameSite cookie.)*
- [x] **PCS-PRIV-002** Collect only data required for diagnosis/reliability/operation/consented features. *(Development implementation is machine-enforced by `data/privacy/data-inventory-v0.1-dev.json`, `docs/model/DATA_MINIMIZATION_SPEC_v0.1.md`, and `npm run validate:privacy-data`: every migration-created table is inventoried exactly once with purpose/retention/public/export defaults, prohibited direct identity/precise-location/media/contact collection remains absent from the normal app surface, and CI Run 373 / `33050505946` passes the contract. Public legal wording remains PCS-LEGAL-001.)*
- [x] **PCS-PRIV-003** Raw answers/personality scores excluded from third-party analytics payloads by default. *(Current product analytics is first-party-only with third-party export disabled; event/DB allowlists reject answer values, Trait vectors and diagnostic internals, and Chromium network assertions verify answer interactions send no answer value.)*
- [x] **PCS-PRIV-004** Public/shareable result persistence requires explicit user action. *(Separate opt-in Share API/UI; assessment completion itself creates no public snapshot.)*
- [x] **PCS-SEC-001** Secure session tokens, validation, rate limits, security headers, dependency scanning. *(Development implementation verified: 256-bit/hash-only session and share capabilities, server-side write validation, PostgreSQL HMAC fixed-window mutation rate limits with privacy-safe 429s, CSP/HSTS/frame/content-type/referrer/permissions headers, machine-checked security policy, CI production dependency audit, release static/runtime-boundary audit, production client-artifact leakage audit, and trusted-origin/Fetch Metadata guards for state-changing routes. Deployment TLS/trusted-proxy/least-privilege/release review remain OPS/QA gates.)*
- [ ] **PCS-LEGAL-001** Privacy/terms/diagnostic limitations/data deletion-retention explanation before public launch. *(Implementation-grounded `/privacy` and `/terms` PRE-LAUNCH DRAFT routes now expose medical/non-validation/64-code/share/analytics/self-deletion/30-90-180 retention/backup/calibration boundaries and stay explicit `noindex`. Logical restore integrity is CI-tested; independently durable deletion replay/provider behavior plus final jurisdiction/operator/contact/consent/legal approval remain open.)*

Detailed requirements: [`docs/requirements/08_PRIVACY_SECURITY.md`](docs/requirements/08_PRIVACY_SECURITY.md)

## 10. Social sharing and analytics

- [x] **PCS-SOC-001** Shareable result image generated deterministically from stored result + curated artwork. *(Versioned OG/portrait templates consume the sanitized stored share snapshot plus its frozen curated asset version; repeated requests remain byte-identical and E2E verifies the exact artwork response header. CI Run 432 is green.)*
- [x] **PCS-SOC-002** Web Share API, X intent, LINE intent, URL copy where applicable. *(Implemented on the private result page and browser-tested against the generated opaque share URL.)*
- [x] **PCS-SOC-003** Correct Open Graph metadata/card for shareable result pages. *(Development fallback OG card is deterministic, versioned, sanitized and linked through dynamic share-page metadata; final curated illustration treatment remains PCS-SOC-001/Phase 3B.)*
- [x] **PCS-ANA-001** Funnel analytics tracks start/progression/completion/result/share without exporting raw answers. *(First-party event dictionary + server-derived session metadata + client network/DB E2E verified in CI Run 238 / `33036549731`; answer interactions contain position/state only.)*
- [ ] **PCS-ANA-002** Observed type distributions labeled by model/sample/time/scope. *(Aggregation foundation plus a fail-closed publication policy now require a `published` model, `public_use=true` code schema, minimum scope sample, minimum per-code cell count, one-decimal display, exact model/locale/time/sample wording, and `populationClaimAllowed=false`. Current C01D therefore cannot publish a rarity/distribution statistic; final production public model/data evidence remains required.)*
- [ ] **PCS-ANA-003** Privacy-preserving calibration-data export path exists. *(Pre-collection engineering now includes separate consent-purpose/receipt foundations plus strict offline `calibration-export-record-v0.1-dev`: only random record ID + exact wave/consent/model/item/scoring/Trait Dictionary/locale scope + item responses are allowed, mixed scopes/unknown private fields are rejected, and retest/demographic/timing/derived-result fields are excluded. The normal runtime DB role still has zero consent-table access, no `/api/calibration` route/export job/answer-level calibration dataset exists, and legal/retention/operator/sample-plan/version-scope/environment prerequisites remain open.)*

Detailed requirements: [`docs/requirements/09_SOCIAL_SHARING_AND_ANALYTICS.md`](docs/requirements/09_SOCIAL_SHARING_AND_ANALYTICS.md)

## 11. Testing and QA

- [x] **PCS-QA-001** CI performs requirement-ID validation, development type-catalog reachability validation, Item Bank validation, analytics/privacy/retention validation, security baseline validation, production dependency audit, persistence migration validation, real PostgreSQL/application/domain tests, retention cleanup dry-run, TypeScript typecheck, production build, and Chromium browser E2E including responsive-width, keyboard/touch, automated axe accessibility, and committed screenshot visual-regression coverage.
- [x] **PCS-QA-002** Unit tests cover the complete current domain pipeline including interactions, content selection/suppression, confidence/version handling and fail-closed result composition.
- [x] **PCS-QA-003** Fixed structured-result Golden Snapshot verifies deterministic output and input-order invariance.
- [x] **PCS-QA-004** Browser E2E covers anonymous start → back/edit → 147 answers → private result/reload → explicit public share → cookie-free public view → deterministic OG/portrait cards → revocation and public-link invalidation.
- [ ] **PCS-QA-005** Human accessibility/manual release QA complete. *(Execution template + machine fail-closed review record exist; CI forbids fabricated PASS/tester/device evidence. Actual assistive-technology/device walkthrough remains open.)*
- [x] **PCS-QA-006** Visual regression at critical responsive widths. *(16 committed Linux/Chromium baselines: landing + assessment at 320/390/768/1024/1280/1440, completed private result at 390/1440, sanitized public share at 390/1440. The landing baseline was intentionally refreshed with PR #11; normal comparison is green in CI Run 762 (`33240042395`) and Run 764 (`33240600043`), and Visual Baseline Run 18 (`33240600054`) reproduces the current committed set without drift. Baseline-update workflow and policy are separately controlled.)*
- [ ] **PCS-QA-007** Security/privacy checklist before release. *(Automated foundation now includes the 16-threat machine threat model, CodeQL JS/TS `security-extended` scanning on main/PR/weekly schedule, dependency/security audits, fail-closed proxy principal, restricted PostgreSQL runtime-role proof, backup/restore rehearsal and fixed-schema runtime logging. Partial risks bind to canonical production evidence. External security review plus real production edge/roles/TLS/secrets/logs/backup/deletion-replay evidence remain pending.)*

Detailed requirements: [`docs/requirements/10_TESTING_QA.md`](docs/requirements/10_TESTING_QA.md)

## 12. Release and operations

- [ ] **PCS-OPS-001** Separate development/preview/production environments. *(Repository/runtime contracts now make environment class and site origin explicit, fail-close production activation/indexing, and include a provider-independent deployment probe for HTTPS/health/security headers/robots/noindex evidence. Actual distinct deployed identities/databases/domain/TLS observations remain external and canonical evidence is still pending.)*
- [ ] **PCS-OPS-002** Secrets never committed; production has no AI API key requirement. *(Repository enforcement now includes runtime AI-key prohibition, static/client artifact secret scanning, blank-secret `.env.example`, environment validation, non-root standalone packaging and weekly dependency update automation. Actual production secret-store injection/access/rotation evidence remains external.)*
- [ ] **PCS-OPS-003** Error monitoring/health checks. *(Development foundation includes privacy-safe fixed-schema telemetry/logging, bucket-only Web Vitals, minimal DB readiness, production monitor contracts and provider-independent deployment probe. Canonical launch evidence now separately requires independent production monitoring and production log-provider privacy review. Provider configuration/alert routing/deployment correlation/drill/log-retention-access evidence remain pending.)*
- [x] **PCS-OPS-004** Documented production rollback. *(Repository-level runbook covers application, database forward-fix, assessment model, content, illustration assets, share-card template, post-rollback verification and affected-result handling; release-operations validator passed in CI Run 383. Deployment-provider commands/restore rehearsal remain OPS-001/002/006 adjacent evidence rather than part of this documentation requirement.)*
- [ ] **PCS-OPS-005** Assessment/model release requires explicit version freeze/migration review. *(Repository mechanics now freeze the exact candidate model/version tuple, ordered migration set and release-critical source/config SHA-256s into a post-E2E release evidence pack tied to the full Git commit/run identity. Published history remains immutable and activation is fail-closed. Actual Phase 5C production model freeze/promotion remains pending.)*
- [ ] **PCS-OPS-006** Public launch gate complete before announcing v1.0. *(Fail-closed launch/runtime gates now consume a canonical 18-record production evidence registry. Production retention scheduling and production log-provider privacy are explicit launch blockers in addition to environment/TLS/secrets/DB/proxy/backup/monitoring/a11y/security/legal/field-performance and Phase 5/content/art evidence. Every future `complete` state requires inspectable artifact/time/reviewer/environment/notes; all remain pending.)*

Detailed requirements: [`docs/requirements/11_RELEASE_OPERATIONS.md`](docs/requirements/11_RELEASE_OPERATIONS.md)

## 13. Delivery phases

- [x] Phase 0A — repository/application foundation.
- [x] Phase 0B — initial non-AI visual/responsive direction.
- [x] Phase 0C — authoritative requirement governance.
- [x] Phase 1A — Trait Dictionary v0.2 conceptual/item-authoring freeze.
- [x] Phase 1B — overlap + interaction conceptual/hypothesis freeze.
- [x] Phase 1C — 147-item reviewed candidate bank v0.2.
- [x] Phase 1D — deterministic scoring + experimental Core/Extended Code engineering specification.
- [x] Phase 2A — complete deterministic domain result engine + Golden Snapshot.
- [x] Phase 2B — PostgreSQL/Drizzle persistence + model immutability + anonymous private-result persistence foundation.
- [x] Phase 2C — real assessment/result UX and server/web wiring, including Chromium 147-answer E2E.
- [ ] Phase 3A — public Core Type/content catalog. *(ACTIVE: all 64 non-public C01D draft entries, provenance/neighbor checks, fail-closed human approval ledger, publication gate and deterministic 64-packet review worklist are complete as engineering/review foundations; actual human approvals + public schema/catalog promotion remain.)*
- [ ] Phase 3B — illustrations. *(ACTIVE: slot grammar, 64 production briefs, production registry, provenance/hash/dimension/variant lineage and approval validation are implemented; real curated hero production/art-direction approval remain.)*
- [x] Phase 4A — social sharing/OG. *(Development implementation complete: explicit sanitized sharing/revocation, X/LINE/Web Share/copy, deterministic OG/portrait images, immutable result→share artwork lineage, and a curated versioned fallback asset. Final type-specific artwork/public taxonomy remain Phase 3A/3B gates rather than sharing-engine blockers.)*
- [ ] Phase 4B — analytics/monitoring. *(ACTIVE: privacy-bounded funnel telemetry, scoped observed-distribution, analytics/rate-limit cleanup, executable 30/90/180-day diagnostic retention with dry-run+integration proof, fixed-category error telemetry, bucket-only Web Vitals, DB readiness and observability contracts are verified; deployed scheduling/environment separation/independent alerting and consented calibration export remain.)*
- [ ] Phase 5A — closed beta/calibration collection. *(PLANNING FOUNDATION: consent receipt persistence and exact prerequisite-status ledger now exist while runtime collection/export remain disabled; actual approved consent, sample plan, closed-beta participants, retest cohort and ambiguity feedback remain uncollected.)*
- [ ] Phase 5B — statistical review/pruning/retest.
- [ ] Phase 5C — production assessment/public code model v1.0 freeze.
- [ ] Phase 6 — public web launch.

Detailed exit criteria: [`docs/requirements/12_DELIVERY_PHASES.md`](docs/requirements/12_DELIVERY_PHASES.md)

## 14. Traceability

- [x] Requirement-to-code/test matrix maintained: [`docs/TRACEABILITY_MATRIX.md`](docs/TRACEABILITY_MATRIX.md).
- [x] Requirement declaration IDs are machine-checked for unapproved Master shadowing/duplicates by `scripts/validate-requirement-ids.mjs`.
- [ ] Every checked production implementation requirement has final release-grade evidence. *(Phase-specific conceptual/development completions are labeled as such.)*
- [x] Requirement changes/release notes continuously record rationale and affected model/content versions through production lifecycle. *(Governance process implemented via `requirement-change-ledger-v0.1-dev` + CI validator. Each material entry records IDs, rationale, impacted files, assessment/code/content/data/compatibility impact and evidence; this remains an ongoing obligation for future changes.)*

Traceability rules: [`docs/requirements/13_TRACEABILITY.md`](docs/requirements/13_TRACEABILITY.md)
