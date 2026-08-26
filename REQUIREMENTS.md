# Personality Code System — Master Requirements & Delivery Checklist

> Status: authoritative development contract
> Version: 0.2.0
> Last updated: 2026-08-26

This file is the single top-level source of truth for product scope and delivery status. Detailed requirements live under `docs/requirements/` and are referenced from this master file.

## 0. Requirement precedence

When documents conflict, use this order:

1. `REQUIREMENTS.md` — product invariants, scope, delivery gates.
2. `docs/requirements/*.md` — authoritative domain requirements.
3. `docs/PRODUCT_SPEC.md`, `docs/DESIGN_SYSTEM.md`, `docs/DIAGNOSTIC_MODEL.md` and versioned model artifacts — design/research specifications subject to the authoritative requirements above.
4. Implementation notes, issues, comments, prototypes.

A lower-priority document MUST NOT silently override a higher-priority one. Any intentional requirement change must update the master checklist and every affected derivative requirement file in the same change set.

## 1. Non-negotiable product invariants

- [x] **PCS-GOV-001** User-facing diagnosis is deterministic and reproducible for a fixed assessment model version.
- [x] **PCS-GOV-002** No AI/LLM/generative model is used at runtime to score, classify, write, rewrite, personalize, or decide user-facing diagnostic results.
- [x] **PCS-GOV-003** AI may be used only as development tooling outside the shipped runtime; production must not require an AI API key or AI service dependency.
- [x] **PCS-GOV-004** Same complete answer set + same model version = same trait scores, code, selected content modules, and result snapshot.
- [x] **PCS-GOV-005** Results and model versions are immutable once published; revisions create a new version.
- [x] **PCS-GOV-006** The product must not claim scientific validation before the defined calibration gates are met.
- [x] **PCS-GOV-007** Population rarity must never be fabricated from theoretical combinations; only clearly scoped observed sample distributions may be shown.
- [x] **PCS-GOV-008** The product must not present itself visually or verbally as an “AI personality diagnosis” service.
- [x] **PCS-GOV-009** Web UI must be intentionally usable on both PC and smartphone, not merely scaled down.
- [x] **PCS-GOV-010** Core diagnostic content remains understandable without an account and without social sharing.

Detailed governance: [`docs/requirements/00_GOVERNANCE.md`](docs/requirements/00_GOVERNANCE.md)

## 2. Product scope

- [ ] **PCS-PROD-001** Public landing page clearly explains what PCS measures and what it does not claim.
- [ ] **PCS-PROD-002** Assessment can be started without registration.
- [ ] **PCS-PROD-003** User can complete a full assessment and receive a result.
- [ ] **PCS-PROD-004** Result includes Core Type, Extended Code, trait vector summary, confidence metadata, and narrative domains.
- [ ] **PCS-PROD-005** Result includes strengths and adversarial/failure-mode analysis.
- [ ] **PCS-PROD-006** Result includes dedicated relationship/love, work, and stress sections.
- [ ] **PCS-PROD-007** Result can be saved/shared only through explicit user action.
- [ ] **PCS-PROD-008** Compatibility is excluded from MVP unless its deterministic specification is completed and versioned.

Detailed scope: [`docs/requirements/01_PRODUCT_SCOPE.md`](docs/requirements/01_PRODUCT_SCOPE.md)

## 3. Diagnostic model

- [x] **PCS-DIAG-001** Freeze Trait Dictionary v0.2 with definitions, opposites, inclusion/exclusion boundaries, and behavioral anchors. *(Conceptual/item-authoring freeze; not empirical validation.)*
- [x] **PCS-DIAG-002** Complete trait overlap matrix and remove/merge unjustifiably redundant traits. *(Conceptual review complete; empirical discriminant review remains required.)*
- [x] **PCS-DIAG-003** Define result presentation domains separately from latent/measured traits.
- [x] **PCS-DIAG-004** Define versioned trait interaction rules. *(Current rules are hypotheses.)*
- [x] **PCS-DIAG-005** Define required psychometric evidence before any construct is described as validated.

Model artifacts:

- [`docs/model/TRAIT_DICTIONARY_v0.2.md`](docs/model/TRAIT_DICTIONARY_v0.2.md)
- [`docs/model/TRAIT_OVERLAP_MATRIX_v0.2.md`](docs/model/TRAIT_OVERLAP_MATRIX_v0.2.md)
- [`docs/model/TRAIT_INTERACTIONS_v0.1.md`](docs/model/TRAIT_INTERACTIONS_v0.1.md)
- [`docs/model/VALIDATION_GATES_v0.1.md`](docs/model/VALIDATION_GATES_v0.1.md)

Detailed model requirements: [`docs/requirements/02_DIAGNOSTIC_MODEL.md`](docs/requirements/02_DIAGNOSTIC_MODEL.md)

## 4. Question bank and scoring

- [ ] **PCS-SCORE-001** Author 6–8 candidate items per retained trait before pruning.
- [ ] **PCS-SCORE-002** Review all items for double-barreling, desirability bias, jargon, ambiguity, and transparent “correct” answers.
- [ ] **PCS-SCORE-003** Version every assessment item and scoring key.
- [ ] **PCS-SCORE-004** Implement deterministic normalized trait scoring.
- [ ] **PCS-SCORE-005** Implement confidence/response-quality metadata without labeling users deceptive.
- [ ] **PCS-SCORE-006** Add golden fixtures proving exact reproducibility.

Detailed scoring: [`docs/requirements/03_ITEM_BANK_AND_SCORING.md`](docs/requirements/03_ITEM_BANK_AND_SCORING.md)

## 5. Personality code and result engine

- [ ] **PCS-RESULT-001** Specify Core Code dimensions from interpretable measured structure, not a marketing-first target count.
- [ ] **PCS-RESULT-002** Specify Extended Code syntax and version behavior.
- [ ] **PCS-RESULT-003** Implement deterministic content module selection.
- [ ] **PCS-RESULT-004** Implement contradiction-prevention and content precedence rules.
- [ ] **PCS-RESULT-005** Persist immutable result snapshots with assessment model/content versions.

Detailed result engine: [`docs/requirements/04_CODE_AND_RESULT_ENGINE.md`](docs/requirements/04_CODE_AND_RESULT_ENGINE.md)

## 6. Type content and illustrations

- [ ] **PCS-CONTENT-001** Create versioned Core Type catalog.
- [ ] **PCS-CONTENT-002** Create editorial content modules for every required result domain.
- [ ] **PCS-CONTENT-003** Create adversarial analysis modules that describe failure modes without insults or deterministic certainty.
- [ ] **PCS-ART-001** Define a single coherent illustration art direction.
- [ ] **PCS-ART-002** Produce one curated hero illustration per published Core Type.
- [ ] **PCS-ART-003** Runtime image generation is prohibited; result artwork references curated versioned assets.

Detailed content/art: [`docs/requirements/05_CONTENT_AND_ILLUSTRATION.md`](docs/requirements/05_CONTENT_AND_ILLUSTRATION.md)

## 7. Frontend, responsive UX, accessibility

- [x] **PCS-FE-001** Next.js App Router + React + TypeScript foundation exists.
- [x] **PCS-FE-002** Initial responsive visual system exists.
- [ ] **PCS-FE-003** Assessment UX implemented against real item bank.
- [ ] **PCS-FE-004** Result dossier UX implemented against real result schema.
- [ ] **PCS-FE-005** Verify layouts at 320, 375/390, 768, 1024, 1280, and 1440+ CSS px.
- [ ] **PCS-A11Y-001** Keyboard-only assessment completion works.
- [ ] **PCS-A11Y-002** WCAG-oriented semantic labeling, focus, contrast, zoom, motion, and touch-target checks pass.
- [ ] **PCS-PERF-001** Public pages meet defined performance budgets and acceptable Core Web Vitals.

Detailed frontend requirements: [`docs/requirements/06_FRONTEND_RESPONSIVE_UX.md`](docs/requirements/06_FRONTEND_RESPONSIVE_UX.md)

## 8. Application architecture and data

- [ ] **PCS-ARCH-001** Diagnostic domain logic is framework-independent and separately testable from UI.
- [ ] **PCS-ARCH-002** Database schema supports anonymous sessions, model versions, items, answers, scores, snapshots, content, and assets.
- [ ] **PCS-ARCH-003** Raw answers are never embedded into public URLs or social cards.
- [ ] **PCS-ARCH-004** Published model and result snapshots are immutable/auditable.
- [ ] **PCS-ARCH-005** Database migrations and rollback procedure are defined before production persistence.

Detailed architecture: [`docs/requirements/07_APPLICATION_ARCHITECTURE_AND_DATA.md`](docs/requirements/07_APPLICATION_ARCHITECTURE_AND_DATA.md)

## 9. Privacy and security

- [ ] **PCS-PRIV-001** Anonymous assessment is the default.
- [ ] **PCS-PRIV-002** Collect only data required for diagnosis, reliability analysis, service operation, or explicitly consented features.
- [ ] **PCS-PRIV-003** Raw answers/personality scores are excluded from third-party analytics payloads by default.
- [ ] **PCS-PRIV-004** Public/shareable result persistence requires explicit user action.
- [ ] **PCS-SEC-001** Apply secure session tokens, validation, rate limiting, security headers, and dependency scanning.
- [ ] **PCS-LEGAL-001** Privacy policy, terms, diagnostic limitations, and data deletion/retention explanation exist before public launch.

Detailed privacy/security: [`docs/requirements/08_PRIVACY_SECURITY.md`](docs/requirements/08_PRIVACY_SECURITY.md)

## 10. Social sharing and analytics

- [ ] **PCS-SOC-001** Shareable result image generated deterministically from stored result data and curated artwork.
- [ ] **PCS-SOC-002** Web Share API, X share intent, LINE share intent, and URL copy supported where applicable.
- [ ] **PCS-SOC-003** Open Graph metadata/card is correct for shareable result pages.
- [ ] **PCS-ANA-001** Funnel analytics tracks starts, progression, completion, result viewing, and sharing without exporting raw answers.
- [ ] **PCS-ANA-002** Observed type distribution is clearly labeled by model version/sample/time scope.
- [ ] **PCS-ANA-003** Calibration datasets can be exported in privacy-preserving form for statistical analysis.

Detailed sharing/analytics: [`docs/requirements/09_SOCIAL_SHARING_AND_ANALYTICS.md`](docs/requirements/09_SOCIAL_SHARING_AND_ANALYTICS.md)

## 11. Testing and QA

- [x] **PCS-QA-001** CI performs TypeScript typecheck and production build.
- [ ] **PCS-QA-002** Unit tests cover scoring, normalization, code generation, content selection, confidence calculation, and version handling.
- [ ] **PCS-QA-003** Golden result snapshots verify deterministic outputs.
- [ ] **PCS-QA-004** End-to-end tests cover anonymous start → answer → result → optional share.
- [ ] **PCS-QA-005** Automated accessibility checks plus manual keyboard/mobile checks are required.
- [ ] **PCS-QA-006** Visual regression tests cover critical responsive widths.
- [ ] **PCS-QA-007** Security/privacy test checklist passes before release.

Detailed QA: [`docs/requirements/10_TESTING_QA.md`](docs/requirements/10_TESTING_QA.md)

## 12. Release and operations

- [ ] **PCS-OPS-001** Separate development/preview/production environments.
- [ ] **PCS-OPS-002** Secrets never committed; production has no AI API key requirement.
- [ ] **PCS-OPS-003** Error monitoring and health checks configured.
- [ ] **PCS-OPS-004** Production deployment has documented rollback.
- [ ] **PCS-OPS-005** Assessment model release process requires explicit version freeze and migration review.
- [ ] **PCS-OPS-006** Public launch gate completed before announcing v1.0.

Detailed operations: [`docs/requirements/11_RELEASE_OPERATIONS.md`](docs/requirements/11_RELEASE_OPERATIONS.md)

## 13. Delivery phases

- [x] Phase 0A — repository/application foundation.
- [x] Phase 0B — initial non-AI visual direction and responsive prototype.
- [x] Phase 0C — authoritative requirement system created.
- [x] Phase 1A — Trait Dictionary v0.2. *(Conceptual/item-authoring freeze.)*
- [x] Phase 1B — overlap + interaction matrix. *(Conceptual/hypothesis freeze.)*
- [ ] Phase 1C — candidate item bank.
- [ ] Phase 1D — scoring/code specification.
- [ ] Phase 2A — real deterministic assessment engine.
- [ ] Phase 2B — persistence/model versioning.
- [ ] Phase 2C — real result engine/page.
- [ ] Phase 3A — Core Type catalog/content.
- [ ] Phase 3B — illustrations.
- [ ] Phase 4A — social sharing/OG cards.
- [ ] Phase 4B — analytics/error monitoring.
- [ ] Phase 5A — closed beta/calibration.
- [ ] Phase 5B — model pruning/retest analysis.
- [ ] Phase 5C — assessment model v1.0 freeze.
- [ ] Phase 6 — public web launch.

Detailed phase exit criteria: [`docs/requirements/12_DELIVERY_PHASES.md`](docs/requirements/12_DELIVERY_PHASES.md)

## 14. Traceability

Every production-impacting requirement should ultimately map to implementation and verification evidence.

- [x] Requirement-to-code/test traceability table established and maintained from Phase 1 onward: [`docs/TRACEABILITY_MATRIX.md`](docs/TRACEABILITY_MATRIX.md).
- [ ] Each checked implementation requirement has verifiable evidence (test, file, screenshot, report, or release artifact).
- [ ] Requirement changes are recorded with rationale and affected model/content versions.

Traceability rules/template: [`docs/requirements/13_TRACEABILITY.md`](docs/requirements/13_TRACEABILITY.md)