# 12 — Delivery Phases and Exit Criteria

This file turns the product requirements into an execution order. A later phase may be prototyped early, but its production implementation must not force unresolved earlier-layer decisions.

## Phase 0 — Foundation

### 0A Repository/application foundation — COMPLETE

- [x] Repository created.
- [x] Next.js/React/TypeScript scaffold exists.
- [x] Typecheck + production-build CI exists.

### 0B Visual/responsive direction — COMPLETE as foundation

- [x] Initial non-AI visual language documented.
- [x] Responsive assessment UI prototype exists.
- [x] PC/mobile design intent documented.

### 0C Requirement governance — COMPLETE after this requirements commit

Exit criteria:

- [x] master requirements/checklist;
- [x] derivative domain requirements;
- [x] runtime AI prohibition explicit;
- [x] requirement precedence defined;
- [x] traceability process defined.

## Phase 1 — Measurement specification

### 1A Trait Dictionary v0.2

- [ ] audit 24 working candidates;
- [ ] define inclusion/exclusion boundaries;
- [ ] write 10/30/50/70/90 behavioral anchors;
- [ ] classify presentation domains;
- [ ] merge/remove unjustifiable overlap;
- [ ] freeze retained candidate IDs for item-writing round.

Exit: every retained trait meets `02_DIAGNOSTIC_MODEL.md` admission criteria.

### 1B Overlap and interaction matrix

- [ ] pairwise conceptual overlap matrix;
- [ ] high-risk redundant pairs reviewed;
- [ ] initial high-value interaction candidates specified;
- [ ] interaction precedence/conflict implications documented.

Exit: no known unexplained duplicate construct remains.

### 1C Candidate item bank

- [ ] 6–8 items per retained trait;
- [ ] independent wording review;
- [ ] desirability/ambiguity review;
- [ ] counter-keyed items reviewed for clarity;
- [ ] item IDs/revisions created;
- [ ] bank frozen as beta candidate set.

### 1D Scoring and code specification

- [ ] answer scale mapping frozen;
- [ ] scoring formula per trait;
- [ ] normalization/rounding;
- [ ] confidence rules;
- [ ] Core Code dimensions/rules;
- [ ] Extended Code schema;
- [ ] interaction thresholds;
- [ ] golden examples manually calculated.

Exit: complete answer set can be transformed to an expected result manually from the written specification without interpretation.

## Phase 2 — Functional deterministic MVP

### 2A Domain engine

- [ ] assessment model types;
- [ ] validation;
- [ ] scoring;
- [ ] confidence;
- [ ] code generation;
- [ ] interaction engine;
- [ ] content selection skeleton;
- [ ] golden/unit tests.

### 2B Persistence/model versioning

- [ ] database/ORM ADR;
- [ ] schema/migrations;
- [ ] anonymous sessions;
- [ ] answers;
- [ ] model version records;
- [ ] immutable result snapshots;
- [ ] retention baseline.

### 2C Real assessment/result UX

- [ ] replace prototype questions with active model data;
- [ ] resume/back/edit behavior;
- [ ] finalize flow;
- [ ] real result schema rendering;
- [ ] method/version/limitations display;
- [ ] private-by-default result behavior.

Exit: anonymous user can complete a real deterministic assessment end-to-end with no AI service.

## Phase 3 — Content identity system

### 3A Core Type/content catalog

- [ ] all reachable Core Types defined;
- [ ] all mandatory result modules covered;
- [ ] contradiction review;
- [ ] adversarial analysis review;
- [ ] Japanese editorial QA.

### 3B Illustration system

- [ ] art direction approved;
- [ ] type-to-asset mapping;
- [ ] one approved hero asset per reachable type;
- [ ] responsive/OG/portrait crops tested;
- [ ] fallback behavior.

Exit: no result can resolve to missing copy or missing required visual asset.

## Phase 4 — Sharing, analytics and operationalization

### 4A Social sharing

- [ ] explicit share snapshot creation;
- [ ] opaque public URL;
- [ ] OG image;
- [ ] portrait card;
- [ ] Web Share/X/LINE/copy;
- [ ] revocation/deletion behavior if supported.

### 4B Analytics/monitoring

- [ ] event dictionary;
- [ ] privacy-reviewed instrumentation;
- [ ] error monitoring;
- [ ] performance monitoring;
- [ ] calibration data pipeline;
- [ ] no raw-answer third-party leakage audit.

## Phase 5 — Closed beta and calibration

### 5A Closed beta

- [ ] recruit sufficiently varied beta users;
- [ ] track completion/drop-off;
- [ ] collect reliability/calibration evidence under documented consent/privacy basis;
- [ ] run retest subset;
- [ ] capture qualitative ambiguity feedback without allowing anecdotes alone to redefine scoring.

### 5B Statistical review

- [ ] item distributions;
- [ ] item-total relationships;
- [ ] omega/internal consistency;
- [ ] retest stability;
- [ ] factor analyses as sample permits;
- [ ] redundant trait review;
- [ ] item pruning/rewording decisions;
- [ ] bias/invariance/DIF review as sample permits.

### 5C Model v1.0 freeze

- [ ] final active item set;
- [ ] scoring version;
- [ ] code schema;
- [ ] content compatibility;
- [ ] all golden fixtures regenerated intentionally and reviewed;
- [ ] evidence/status claims reviewed;
- [ ] model release notes.

## Phase 6 — Public web release

- [ ] all `11_RELEASE_OPERATIONS.md` public launch gates pass;
- [ ] domain + E2E + responsive + accessibility + security suites pass;
- [ ] legal/privacy pages match implementation;
- [ ] production rollback/readiness confirmed;
- [ ] release version/tag created;
- [ ] public launch.

## Post-launch

- [ ] monitor errors/performance;
- [ ] monitor item/drop-off quality;
- [ ] publish scoped sample distribution only after sufficient valid data;
- [ ] keep old models readable/reproducible;
- [ ] changes to scoring create explicit model versions;
- [ ] evaluate compatibility feature only after deterministic specification is ready.
