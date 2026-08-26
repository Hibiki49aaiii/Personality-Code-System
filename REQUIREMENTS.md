# Personality Code System — Master Requirements & Delivery Checklist

> Status: authoritative development contract
> Version: 0.7.0
> Last updated: 2026-08-26

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

- [ ] **PCS-PROD-001** Public landing page clearly explains what PCS measures and does not claim.
- [x] **PCS-PROD-002** Assessment can start without registration. *(Anonymous HttpOnly bearer-cookie flow implemented and browser-tested.)*
- [x] **PCS-PROD-003** User can complete a real assessment and receive a real result. *(Reviewed 147-item development model; production calibration remains later.)*
- [x] **PCS-PROD-004** Result includes Core Type/Code, Extended Code, Trait summary, confidence metadata, and narrative domains. *(Current content is development-versioned, not final editorial copy.)*
- [ ] **PCS-PROD-005** Result includes strengths and adversarial/failure-mode analysis. *(Domain structure exists; production editorial coverage remains Phase 3.)*
- [x] **PCS-PROD-006** Result includes dedicated relationships/love, work, and stress sections. *(Structured domains are rendered from versioned modules.)*
- [ ] **PCS-PROD-007** Public saving/sharing occurs only through explicit user action. *(No public sharing exists yet; Phase 4 will implement and verify this.)*
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
- [ ] **PCS-SCORE-003** Every item/scoring key is versioned through a formal production active-model release/freeze lifecycle. *(Revision/model metadata and DB release records exist; final production activation workflow remains Phase 5C.)*
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
- [ ] **PCS-RESULT-005** Immutable result snapshots persisted with all required model/content/asset versions. *(Current dev snapshot + PostgreSQL immutability are implemented/tested; curated illustration asset/version linkage remains Phase 3.)*

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

- [ ] **PCS-CONTENT-001** Versioned published Core Type catalog exists for every reachable public code. *(Phase 3A draft foundation now enumerates all 64 reachable non-public C01D codes; public schema + authored catalog remain open.)*
- [ ] **PCS-CONTENT-002** Editorial content modules cover every required result domain.
- [ ] **PCS-CONTENT-003** Adversarial analysis modules describe failure modes without insults/diagnoses/deterministic certainty.
- [ ] **PCS-ART-001** Single coherent illustration art direction defined.
- [ ] **PCS-ART-002** One curated hero illustration per published Core Type.
- [ ] **PCS-ART-003** Runtime image generation prohibited; result artwork uses curated versioned assets.

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
- [ ] **PCS-FE-005** Layouts verified at 320, 375/390, 768, 1024, 1280, 1440+ CSS px.
- [ ] **PCS-A11Y-001** Keyboard-only assessment completion works.
- [ ] **PCS-A11Y-002** Semantic labeling, focus, contrast, zoom, motion, and touch-target checks pass.
- [ ] **PCS-PERF-001** Public pages meet defined performance budgets/acceptable Core Web Vitals.

Detailed requirements: [`docs/requirements/06_FRONTEND_RESPONSIVE_UX.md`](docs/requirements/06_FRONTEND_RESPONSIVE_UX.md)

## 8. Application architecture and data

- [x] **PCS-ARCH-001** Diagnostic domain logic is framework-independent and separately testable from UI/database.
- [x] **PCS-ARCH-002** Database schema supports anonymous sessions, model versions, items/revisions, answers, scores, snapshots, content, and asset references.
- [ ] **PCS-ARCH-003** Raw answers never embedded into public URLs/social cards. *(Current private flow keeps raw answers out of URLs/snapshots; public-share implementation/audit remains Phase 4.)*
- [x] **PCS-ARCH-004** Published model/content and retained result snapshots are immutable/auditable in persistence. *(PostgreSQL triggers + real integration tests.)*
- [x] **PCS-ARCH-005** Database migrations/rollback procedure defined before production persistence. *(ADR + ordered committed migrations + validator + PostgreSQL CI; deployment recovery rehearsal remains OPS work.)*

Persistence artifacts:

- `docs/adr/ADR-0001-persistence-postgresql-drizzle.md`;
- `drizzle/0000_phase2b_persistence.sql`;
- `drizzle/0001_phase2b_immutability_hardening.sql`;
- `src/infrastructure/persistence/schema.ts`;
- `src/infrastructure/persistence/sessionToken.ts`;
- `src/infrastructure/persistence/database.ts`;
- `src/infrastructure/persistence/anonymousAssessmentRepository.ts`;
- `docs/model/PERSISTENCE_RETENTION_BASELINE_v0.1.md`.

Detailed requirements: [`docs/requirements/07_APPLICATION_ARCHITECTURE_AND_DATA.md`](docs/requirements/07_APPLICATION_ARCHITECTURE_AND_DATA.md)

## 9. Privacy and security

- [x] **PCS-PRIV-001** Anonymous assessment default in real web flow. *(No account; opaque 256-bit token stored only as hash server-side; browser carries HttpOnly/SameSite cookie.)*
- [ ] **PCS-PRIV-002** Collect only data required for diagnosis/reliability/operation/consented features.
- [ ] **PCS-PRIV-003** Raw answers/personality scores excluded from third-party analytics payloads by default.
- [ ] **PCS-PRIV-004** Public/shareable result persistence requires explicit user action.
- [ ] **PCS-SEC-001** Secure session tokens, validation, rate limits, security headers, dependency scanning. *(Token/validation/cookie controls exist; rate limiting, full security headers and dependency-security gate remain.)*
- [ ] **PCS-LEGAL-001** Privacy/terms/diagnostic limitations/data deletion-retention explanation before public launch.

Detailed requirements: [`docs/requirements/08_PRIVACY_SECURITY.md`](docs/requirements/08_PRIVACY_SECURITY.md)

## 10. Social sharing and analytics

- [ ] **PCS-SOC-001** Shareable result image generated deterministically from stored result + curated artwork.
- [ ] **PCS-SOC-002** Web Share API, X intent, LINE intent, URL copy where applicable.
- [ ] **PCS-SOC-003** Correct Open Graph metadata/card for shareable result pages.
- [ ] **PCS-ANA-001** Funnel analytics tracks start/progression/completion/result/share without exporting raw answers.
- [ ] **PCS-ANA-002** Observed type distributions labeled by model/sample/time/scope.
- [ ] **PCS-ANA-003** Privacy-preserving calibration-data export path exists.

Detailed requirements: [`docs/requirements/09_SOCIAL_SHARING_AND_ANALYTICS.md`](docs/requirements/09_SOCIAL_SHARING_AND_ANALYTICS.md)

## 11. Testing and QA

- [x] **PCS-QA-001** CI performs requirement-ID validation, development type-catalog reachability validation, Item Bank validation, persistence migration validation, real PostgreSQL/application/domain tests, TypeScript typecheck, production build, and Chromium browser E2E.
- [x] **PCS-QA-002** Unit tests cover the complete current domain pipeline including interactions, content selection/suppression, confidence/version handling and fail-closed result composition.
- [x] **PCS-QA-003** Fixed structured-result Golden Snapshot verifies deterministic output and input-order invariance.
- [x] **PCS-QA-004** Browser E2E covers anonymous start → back/edit → 147 answers → result/reload and private-result isolation. *(Optional public share remains Phase 4.)*
- [ ] **PCS-QA-005** Automated accessibility + manual keyboard/mobile checks.
- [ ] **PCS-QA-006** Visual regression at critical responsive widths.
- [ ] **PCS-QA-007** Security/privacy checklist before release.

Detailed requirements: [`docs/requirements/10_TESTING_QA.md`](docs/requirements/10_TESTING_QA.md)

## 12. Release and operations

- [ ] **PCS-OPS-001** Separate development/preview/production environments.
- [ ] **PCS-OPS-002** Secrets never committed; production has no AI API key requirement.
- [ ] **PCS-OPS-003** Error monitoring/health checks.
- [ ] **PCS-OPS-004** Documented production rollback.
- [ ] **PCS-OPS-005** Assessment/model release requires explicit version freeze/migration review.
- [ ] **PCS-OPS-006** Public launch gate complete before announcing v1.0.

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
- [ ] Phase 3A — public Core Type/content catalog. *(ACTIVE: non-public C01D 64-code reachability/provenance foundation complete; naming/editorial/public promotion remain.)*
- [ ] Phase 3B — illustrations.
- [ ] Phase 4A — social sharing/OG.
- [ ] Phase 4B — analytics/monitoring.
- [ ] Phase 5A — closed beta/calibration collection.
- [ ] Phase 5B — statistical review/pruning/retest.
- [ ] Phase 5C — production assessment/public code model v1.0 freeze.
- [ ] Phase 6 — public web launch.

Detailed exit criteria: [`docs/requirements/12_DELIVERY_PHASES.md`](docs/requirements/12_DELIVERY_PHASES.md)

## 14. Traceability

- [x] Requirement-to-code/test matrix maintained: [`docs/TRACEABILITY_MATRIX.md`](docs/TRACEABILITY_MATRIX.md).
- [x] Requirement declaration IDs are machine-checked for unapproved Master shadowing/duplicates by `scripts/validate-requirement-ids.mjs`.
- [ ] Every checked production implementation requirement has final release-grade evidence. *(Phase-specific conceptual/development completions are labeled as such.)*
- [ ] Requirement changes/release notes continuously record rationale and affected model/content versions through production lifecycle.

Traceability rules: [`docs/requirements/13_TRACEABILITY.md`](docs/requirements/13_TRACEABILITY.md)
