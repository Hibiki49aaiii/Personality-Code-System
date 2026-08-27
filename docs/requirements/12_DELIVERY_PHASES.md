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

### 2A Domain engine — COMPLETE as deterministic development pipeline
- [x] assessment/scoring types and validation;
- [x] reviewed item-bank materialization;
- [x] deterministic Trait scoring;
- [x] response-quality v0.1 baseline;
- [x] Core/Extended Code generation;
- [x] executable 20-rule interaction engine;
- [x] deterministic content-module data model;
- [x] assertion/suppression/priority content composer;
- [x] 18-domain structured result schema;
- [x] missing required result domain fails closed;
- [x] integrated result engine from answers through sections;
- [x] fixed Golden Result Snapshot fixture and exact-equality regression test;
- [x] input-order and version-mismatch regression tests.

Exit achieved: one pure domain pipeline transforms versioned answers/model data into a complete structured result independent of Next.js/UI and AI services.

Production editorial copy and public type taxonomy remain Phase 3/5 work.

### 2B Persistence/model versioning — COMPLETE as persistence foundation
- [x] PostgreSQL + Drizzle ADR;
- [x] typed relational schema;
- [x] ordered committed SQL migrations;
- [x] migration/static invariant validator;
- [x] PostgreSQL 16 integration service in CI;
- [x] anonymous 256-bit bearer-session credential with SHA-256 hash-only DB storage;
- [x] anonymous session persistence adapter;
- [x] answer upsert persistence;
- [x] canonical Trait Score persistence;
- [x] model version records + model-item revision mappings;
- [x] result snapshot JSONB + indexed exact version metadata;
- [x] DB-level result snapshot UPDATE rejection;
- [x] published model row and child-item immutability;
- [x] immutable Trait/item revisions;
- [x] published content-version/module immutability;
- [x] model-bound answer and scoring-version integrity triggers;
- [x] snapshot session/model/embedded-version coherence trigger;
- [x] completion guard requiring required answers, scores and snapshot;
- [x] completed-session mutation freeze;
- [x] retention/privacy snapshot deletion remains possible;
- [x] transactional adapter: Trait Scores + Snapshot + completion transition;
- [x] private completed-result retrieval by opaque bearer token;
- [x] retention engineering baseline documented;
- [x] migration + DB invariant + typed repository integration tests pass in CI.

Exit achieved for persistence foundation: the application has a tested server-side persistence contract for anonymous assessments and immutable private results.

Not implied by this completion:

- public share URLs (Phase 4);
- final legal retention promises (Phase 6 gate);
- production deployment/database backup rehearsal (release operations);
- final illustration asset linkage in result snapshots (Phase 3);
- final public assessment model release workflow (Phase 5C).

### 2C Real assessment/result UX — COMPLETE as development-model web flow
- [x] seed/load the reviewed development assessment model through the persistence/model delivery layer;
- [x] replace prototype questions with reviewed real item data;
- [x] start anonymous session through server-only persistence adapter;
- [x] store bearer token in HttpOnly/SameSite cookie transport without exposing it in URLs;
- [x] answer save/resume/back/edit behavior;
- [x] final submit invokes deterministic result engine + persistence transaction;
- [x] duplicate-submit/idempotency behavior;
- [x] real structured result rendering from immutable snapshot + exact content version;
- [x] method/version/limitations display;
- [x] private-by-default result retrieval;
- [x] expired/invalid session baseline UX: assessment replaces missing/expired sessions, private result fails closed without bearer cookie;
- [x] Chromium browser E2E for start → back/edit → 147 answers → result → reload/private-isolation.

Exit achieved for Phase 2: an anonymous user can complete the reviewed development assessment end-to-end in the real web application with PostgreSQL persistence and no AI service. CI Run `32960309207` proves Item Bank/persistence/application/domain/type/build/Chromium E2E gates together.

This does **not** promote `C01D` or development fallback copy to public/validated status. Production content/taxonomy, responsive-width certification, accessibility, security hardening, and public sharing remain later phases.

## Phase 3 — Content identity system

### 3A Core Type/content catalog — ACTIVE

The public-code evidence gate remains Phase 5C. Phase 3A therefore builds a complete non-public engineering/editorial catalog against C01D now, while keeping human editorial approval and public promotion as explicit later gates.

#### 3A-0 Development catalog foundation — COMPLETE
- [x] catalog contract separates engineering reachability from public taxonomy claims;
- [x] all 64 reachable C01D Core Codes explicitly frozen in `data/type-catalog/v0.1-dev/reachability.json`;
- [x] stable development type-ID rule `C01D-<CORE_CODE>` documented;
- [x] one-axis neighbor/differentiation rule specified;
- [x] claim-provenance contract specified;
- [x] CI recomputes 2^6 reachability and rejects missing/duplicate/impossible/order-drift codes;
- [x] catalog and source schema are both forced to remain `public_use=false` at this development stage.

#### 3A-1 Deterministic editorial engineering — COMPLETE as non-public development engineering
- [x] 14 provenance-backed Core editorial primitives cover 8 cognitive/governance × 4 action/exploration × 2 relationship modes;
- [x] all 64 Core Codes materialize deterministic Core Identity, Hidden Strengths and Adversarial/Failure modules (192 type modules);
- [x] 21 Traits have low/mid/high editorial bands (63 Trait modules);
- [x] detailed development content v0.3 covers all 18 result domains for the midpoint Golden case without selected fallbacks;
- [x] `assessment-dev-v0.1`, `v0.2`, `v0.3` remain separate immutable development releases instead of overwriting historical content;
- [x] v0.3 Golden Result Snapshot fixture exists and exact-equality test is wired into the domain suite;
- [x] deterministic Japanese display-name grammar is versioned in `display-name-system.ja.json`;
- [x] all 64 reachable codes materialize unique draft display names and identity sentences;
- [x] six-axis display-name provenance and one-axis neighbor differentiation are machine-validated;
- [x] full CI proves validators + Golden v0.3 + PostgreSQL + typecheck + build + Chromium E2E together. *(Run 177 established the repaired content contract; later sharing runs retain these gates.)*

#### 3A-2 Human editorial approval — PENDING
- [ ] all 64 draft names reviewed side-by-side for awkwardness, repetition and unintended connotations;
- [ ] coherent Japanese naming system formally approved for public-facing use;
- [ ] concise Core overviews human-edited where generated composition reads mechanically;
- [ ] strengths/adversarial wording reviewed for symmetry and non-abusive directness;
- [ ] relationship/love, work, stress and growth copy reviewed as a complete user dossier;
- [ ] one-axis neighbor differentiation human-reviewed for every entry;
- [ ] all 20 Interaction outcomes reviewed against Trait-band/Core copy for contradictions and suppression gaps;
- [ ] Japanese proofreading/editorial QA complete;
- [ ] mobile/result/share-card typography tested with the longest names.

Current draft display-name rule and review contract are documented in `docs/TYPE_DISPLAY_NAME_SYSTEM.md`. A development display name is not a final public type name merely because CI can generate it.

#### 3A-3 Public promotion gate — PENDING on Phase 5C
- [ ] public code schema frozen for target production model/version (`public_use=true`);
- [ ] development entries reconciled/migrated to every reachable public code;
- [ ] all mandatory result domains covered by production editorial content;
- [ ] published catalog/version metadata frozen.

Master `PCS-CONTENT-001..003` remain incomplete until the public promotion gate is satisfied. Building the C01D draft catalog does not claim that 64 types are validated or final.

### 3B Illustration system — ACTIVE

#### 3B-0 Illustration engineering foundation — COMPLETE
- [x] coherent non-AI runtime art direction specified;
- [x] stable type-to-asset ID/mapping contract for all 64 development Core Codes;
- [x] 8 role × 4 action × 2 relationship visual grammar defined without runtime compositing;
- [x] CI rejects missing/duplicate/mis-mapped illustration slots;
- [x] runtime image generation remains prohibited.

#### 3B-1 Curated asset production — PENDING
- [ ] owner-approved art direction after visual review;
- [ ] one curated hero master per eventual published reachable type;
- [ ] responsive result crop;
- [ ] 1200×630 OG crop/placement verification;
- [ ] portrait share-card crop/placement verification;
- [ ] accessibility/contrast and longest-name overlay QA;
- [ ] approved asset versions bound into result/share snapshots.

Current 64 development hero slots remain deliberately `unproduced`; engineering slot completeness is not artwork completion.

Exit: no published result can resolve to missing required copy or visual assets.

## Phase 4 — Sharing, analytics and operations

### 4A Social sharing — ACTIVE

#### 4A-1 Sanitized sharing foundation — COMPLETE as development implementation
- [x] explicit Share action creates a separate sanitized immutable public snapshot;
- [x] 256-bit opaque public capability token; database stores SHA-256 hash only;
- [x] public `/s/[token]` result route works without the private assessment cookie;
- [x] raw answers, Trait Scores/vector, Response Quality, Interaction internals and Extended Code are excluded from the public snapshot;
- [x] PostgreSQL rejects prohibited public diagnostic/private fields and version/source mismatches;
- [x] Web Share, X intent, LINE intent and URL copy controls use the exact opaque share URL;
- [x] private owner can revoke every active public link derived from the result;
- [x] deleting the private source result automatically revokes attached public shares before source detachment;
- [x] deterministic development OG card (1200×630) and portrait card (1080×1350) are generated from the sanitized snapshot only;
- [x] same snapshot/template returns byte-identical card output in Chromium E2E;
- [x] revoked share pages and image routes fail closed;
- [x] public page emits dynamic Open Graph/Twitter metadata using the versioned sanitized OG route.

Evidence checkpoint: CI Run 190 proved the image/card and full 147-item browser flow together. Canonical deployment origin is server-only `PCS_SITE_ORIGIN`; preview/production require it explicitly and production requires HTTPS.

#### 4A-2 Production share presentation — PENDING on Phase 3A/3B/5C
- [ ] approved public type name/identity sentence frozen into the share snapshot;
- [ ] approved curated illustration asset version frozen into the share snapshot;
- [ ] production OG/portrait templates visually approved with real hero art;
- [ ] production site origin configured and deployment-level crawler preview verified;
- [ ] final cache/revocation behavior verified against deployed CDN/social preview constraints.

The development fallback card proves deterministic/private-safe plumbing; it does not satisfy the final curated-art requirement in **PCS-SOC-001**.

### 4B Analytics/monitoring — ACTIVE

#### 4B-1 First-party funnel telemetry — COMPLETE as development implementation
- [x] versioned first-party event dictionary;
- [x] first-party browser analytics endpoint with allowlisted bounded properties;
- [x] start/resume/question/answer-interaction/completion/result/share/public-share funnel instrumentation;
- [x] answer interaction records only item position + selected/changed state, never answer value;
- [x] session model/locale metadata is derived/verified server-side rather than trusted from the browser;
- [x] TypeScript validator and PostgreSQL constraint independently reject prohibited diagnostic/private analytics fields;
- [x] session-bound analytics cascade-delete with the anonymous session;
- [x] browser E2E inspects real analytics network payloads and persisted DB rows;
- [x] third-party export remains disabled by default.

Evidence: CI Run 238 (`33036549731`) passes the full 147-item Chromium flow with network/DB telemetry assertions. Privacy/retention baseline: `docs/model/ANALYTICS_PRIVACY_BASELINE_v0.1.md`.

#### 4B-2 Observed distribution foundation — COMPLETE as non-public aggregation engineering
- [x] exact model/code/locale/time-scoped distribution domain;
- [x] immutable result-snapshot aggregation repository;
- [x] integer basis-point shares + explicit sample size/eligibility rule;
- [x] machine-readable `populationClaimAllowed=false`;
- [x] domain + real-DB application integration coverage.

Evidence: CI Run 240 (`33036572687`). Specification: `docs/model/OBSERVED_TYPE_DISTRIBUTION_SPEC_v0.1.md`.

Public display remains pending production model freeze, valid-assessment exclusion/minimum-sample policy and privacy/statistical review; therefore Master `PCS-ANA-002` remains open.

#### 4B-3 Retention/observability foundation — COMPLETE as development implementation
- [x] versioned analytics retention policy (`analytics-retention-v0.1-dev`);
- [x] 30-day unscoped / 90-day session-bound analytics cleanup repository;
- [x] bearer-owned destructive diagnostic self-deletion with public-share cleanup and cookie invalidation;
- [x] versioned diagnostic retention policy with 30-day abandoned-session / 90-day raw-answer / 180-day private-result/session engineering windows;
- [x] dry-run-first analytics + diagnostic retention CLIs with explicit execution acknowledgement;
- [x] PostgreSQL retention-window and destructive-deletion integration coverage;
- [x] fixed-enum client error telemetry with free-form message/stack rejection;
- [x] fixed-schema server fault logger; runtime source may not directly serialize exception objects to `console.error`;
- [x] App Router + assessment/share client/server failure instrumentation;
- [x] bucket-only LCP/INP/CLS/TTFB telemetry; raw value/delta/id excluded;
- [x] minimal PostgreSQL readiness endpoint with no sensitive environment/error details;
- [x] machine-readable production observability monitor classes remain fail-closed until independently durable external monitoring exists;
- [x] representative performance-lab workflow exists separately from field-CWV claims.

Production schedulers, independent monitoring/alerting and field evidence remain external release gates; development completion here must not be interpreted as production operations completion.

#### 4B-4 Production operations/calibration — PARTIAL foundation / external evidence pending
- [x] explicit development/preview/production runtime classification contract;
- [x] production new-assessment activation and public indexing fail closed while launch/model gates are blocked;
- [x] non-root Next standalone container package + real image build/health/landing smoke workflow;
- [x] per-table least-privilege PostgreSQL runtime-role policy and restricted-role CI integration;
- [x] isolated logical backup/restore rehearsal with restore-quarantine/privacy-resurrection policy;
- [ ] scheduled production execution/evidence for retention cleanup;
- [ ] distinct deployed preview/production analytics/database identities;
- [ ] independently durable server/API error-rate monitoring and operational dashboards;
- [ ] database latency/availability monitoring independent of the primary DB;
- [ ] deployment/version correlation + alerting/escalation;
- [ ] real edge/CDN client-address header sanitization evidence;
- [ ] production DB role/grant dump and migration-admin separation evidence;
- [ ] provider backup encryption/access plus deletion-journal replay/non-resurrection proof;
- [ ] legal/consent behavior aligned with analytics implementation;
- [ ] consented privacy-preserving calibration data pipeline/export;
- [ ] deployed third-party/network leakage audit.

Calibration export is intentionally not implemented before consent/governance prerequisites; see `docs/model/CALIBRATION_EXPORT_SPEC_v0.1.md`.

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
- [ ] formal model-release activation/freeze procedure;
- [ ] public Core Code schema (`public_use=true`) chosen from evidence;
- [ ] Extended Code compatibility decision;
- [ ] content compatibility;
- [ ] golden fixtures regenerated/reviewed;
- [ ] evidence/status claims reviewed;
- [ ] release notes.

A public code schema may differ from development `C01D`; that change is expected to be versioned rather than hidden.

## Phase 6 — Public web release — PENDING
- [ ] all release-operation gates;
- [ ] domain + persistence + E2E + responsive + accessibility + security suites;
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
