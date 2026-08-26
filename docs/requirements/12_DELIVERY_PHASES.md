# 12 — Delivery Phases and Exit Criteria

This file turns PCS requirements into execution order. A later layer may be prototyped early, but unresolved earlier-layer assumptions MUST NOT be disguised as completed/validated product behavior.

## Phase 0 — Foundation

### 0A Repository/application foundation — COMPLETE
- [x] Repository/application scaffold.
- [x] Next.js/React/TypeScript foundation.
- [x] CI with validation/tests/typecheck/production build.

### 0B Visual/responsive direction — COMPLETE as foundation
- [x] Non-AI visual language documented.
- [x] Responsive assessment UI prototype.
- [x] PC/mobile intent documented.

### 0C Requirement governance — COMPLETE
- [x] Master requirements/checklist.
- [x] Derivative requirements.
- [x] Runtime AI prohibition.
- [x] Requirement precedence.
- [x] Traceability process.

## Phase 1 — Measurement and code specification

### 1A Trait Dictionary v0.2 — COMPLETE as conceptual/item-authoring freeze
- [x] Audit original 24 candidates.
- [x] Retain 21 direct measured Traits; LDR/DEL/TRN moved to derived profiles.
- [x] Inclusion/exclusion boundaries.
- [x] 10/30/50/70/90 behavioral anchors.
- [x] Presentation domains separated from measured Traits.
- [x] Candidate Trait IDs frozen for item-writing round.

This is not empirical validation.

### 1B Overlap and interaction matrix — COMPLETE as conceptual/hypothesis freeze
- [x] Full pairwise conceptual overlap matrix.
- [x] High-risk redundant pairs reviewed.
- [x] 20 high-value interaction hypotheses specified.
- [x] Deterministic placeholder thresholds/precedence/suppression implications documented.

Empirical discriminant validity remains Phase 5 work.

### 1C Candidate item bank — COMPLETE as reviewed candidate bank

#### 1C-1 Candidate authoring — COMPLETE
- [x] 7 items × 21 Traits = 147.
- [x] 4 positive + 3 reverse per Trait.
- [x] Immutable IDs/revision metadata.
- [x] Machine validation.

#### 1C-2 Complete wording/construct-purity review — COMPLETE
- [x] Every item receives one disposition.
- [x] 98 `accept-r1`.
- [x] 39 `revise-r2`.
- [x] 10 `hold-for-beta` with explicit risk reasons.
- [x] Social-desirability, ambiguity, double-barrel, context, reverse-item and neighbor-contamination pass recorded.
- [x] Review layer preserves ID/primary Trait/direction/weight/order.
- [x] Reviewed-bank CI/materialization tests pass.

Exit status: suitable for engineering integration and closed-beta candidate use; not statistically calibrated.

### 1D Scoring and code specification — COMPLETE as experimental engineering contract

#### 1D-1 Trait scoring — COMPLETE
- [x] Five-point answer mapping versioned.
- [x] Positive/reverse keyed formulas.
- [x] Integer weights/canonical 0..10000 `score_bp` normalization.
- [x] Explicit half-up rounding.
- [x] Missing/invalid/duplicate input rules.
- [x] Response-quality v0.1 baseline separated from Trait Scores.
- [x] Golden/manual fixtures and ordering invariance tests.

#### 1D-2 Core/Extended Code — COMPLETE as non-public development schema
- [x] Direct measured Core anchor dimensions specified in `core-code-v0.1-dev` (`C01D`).
- [x] Symbol semantics/order/threshold/tie behavior versioned.
- [x] Near-boundary metadata rule.
- [x] `PCSX1` Extended Code grammar/order/bands specified.
- [x] Deterministic code engine/tests.
- [x] Schema explicitly `public_use=false` until beta evidence reviews the public taxonomy.

#### 1D-3 Interaction thresholds — COMPLETE as hypotheses
- [x] Current interaction ranges/conditions are deterministic/versioned placeholders.
- [x] Changing thresholds/conditions creates a new interaction-rule version.

Exit: a complete answer set can be deterministically converted to Trait Scores and a development Core/Extended Code without interpretation or AI. Public taxonomy freeze remains Phase 5C.

## Phase 2 — Functional deterministic MVP

### 2A Domain engine — IN PROGRESS
- [x] assessment/scoring types and validation;
- [x] reviewed item-bank materialization;
- [x] deterministic Trait scoring;
- [x] response-quality v0.1 baseline;
- [x] Core/Extended Code generation;
- [ ] executable interaction engine;
- [ ] deterministic content-module data model;
- [ ] content selection/suppression composer;
- [ ] result structured schema;
- [ ] integrated golden result snapshots.

Exit: one pure domain pipeline can transform versioned answers/model data into a complete structured result independent of Next.js/UI.

### 2B Persistence/model versioning — PENDING
- [ ] database/ORM ADR;
- [ ] schema/migrations;
- [ ] anonymous sessions;
- [ ] answers;
- [ ] model version records;
- [ ] immutable result snapshots;
- [ ] retention baseline.

### 2C Real assessment/result UX — PENDING
- [ ] replace prototype questions with reviewed/active model data;
- [ ] resume/back/edit behavior;
- [ ] final submit behavior;
- [ ] real structured result rendering;
- [ ] method/version/limitations display;
- [ ] private-by-default result behavior.

Exit for Phase 2: anonymous user can complete a real deterministic assessment end-to-end with no AI service.

## Phase 3 — Content identity system

### 3A Core Type/content catalog — PENDING
- [ ] public code schema frozen for target model/version;
- [ ] all reachable Core Types cataloged;
- [ ] all mandatory result domains covered;
- [ ] contradiction/suppression coverage reviewed;
- [ ] adversarial analysis reviewed;
- [ ] Japanese editorial QA.

### 3B Illustration system — PENDING
- [ ] art direction approved;
- [ ] type-to-asset mapping;
- [ ] one curated hero asset per published reachable type;
- [ ] responsive/OG/portrait crops;
- [ ] fallback behavior.

Exit: no published result can resolve to missing required copy or visual assets.

## Phase 4 — Sharing, analytics and operations

### 4A Social sharing — PENDING
- [ ] explicit share snapshot creation;
- [ ] opaque public URL;
- [ ] deterministic OG image;
- [ ] portrait share card;
- [ ] Web Share/X/LINE/copy;
- [ ] revocation/deletion behavior if supported.

### 4B Analytics/monitoring — PENDING
- [ ] event dictionary;
- [ ] privacy-reviewed instrumentation;
- [ ] error/performance monitoring;
- [ ] calibration data pipeline;
- [ ] raw-answer third-party leakage audit.

## Phase 5 — Closed beta and calibration

### 5A Closed beta — PENDING
- [ ] varied beta sample;
- [ ] completion/drop-off measurement;
- [ ] privacy/consent basis for calibration evidence;
- [ ] retest subset;
- [ ] ambiguity feedback.

### 5B Statistical review — PENDING
- [ ] item distributions;
- [ ] item-total relationships;
- [ ] omega/internal consistency;
- [ ] test-retest stability;
- [ ] factor analyses as sample permits;
- [ ] Trait redundancy/discriminant review;
- [ ] hold-for-beta item decisions;
- [ ] item pruning/rewording;
- [ ] bias/invariance/DIF as sample permits.

### 5C Model/public code v1.0 freeze — PENDING
- [ ] final active item set;
- [ ] production scoring/model version;
- [ ] public Core Code schema (`public_use=true`) chosen from evidence;
- [ ] Extended Code compatibility decision;
- [ ] content compatibility;
- [ ] golden fixtures regenerated/reviewed;
- [ ] evidence/status claims reviewed;
- [ ] release notes.

A public code schema may differ from development `C01D`; that change is expected to be versioned rather than hidden.

## Phase 6 — Public web release — PENDING
- [ ] all release-operation gates;
- [ ] domain + E2E + responsive + accessibility + security suites;
- [ ] legal/privacy pages match implementation;
- [ ] rollback/readiness confirmed;
- [ ] release version/tag;
- [ ] public launch.

## Post-launch
- [ ] monitor errors/performance/item drop-off;
- [ ] publish only scoped observed sample distributions after sufficient valid data;
- [ ] keep old models/codes readable and reproducible;
- [ ] scoring/code changes create explicit versions;
- [ ] compatibility feature only after deterministic specification is ready.
