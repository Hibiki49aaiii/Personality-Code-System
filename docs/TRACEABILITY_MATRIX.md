# Requirements Traceability Matrix

> Status: active from Phase 1 onward
> Last updated: 2026-08-26

A checkbox in `REQUIREMENTS.md` is marked complete only when inspectable specification/implementation/verification evidence exists. `complete` never implies psychometric validation unless the requirement explicitly concerns validation evidence.

| Requirement | Status | Specification / Evidence | Implementation | Verification |
| --- | --- | --- | --- | --- |
| PCS-GOV-001..010 | complete (policy/invariants) | `REQUIREMENTS.md`, `docs/requirements/00_GOVERNANCE.md` | deterministic domain + persistence boundaries now substantially implemented | CI/runtime architecture; no AI runtime dependency |
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
| PCS-ARCH-001 | complete | `07_APPLICATION_ARCHITECTURE_AND_DATA.md` | `src/domain/assessment/*` isolated from React/DB | compile/tests independent of UI/database |
| PCS-ARCH-002 | complete (Phase 2B foundation) | ADR-0001 + schema contract | `schema.ts`, migration chain | static migration validator + real PostgreSQL 16 integration |
| PCS-ARCH-003 | partial | raw-answer separation/public-share requirement | private snapshot/retrieval excludes raw answers | public URL/OG/share payload audit remains Phase 4 |
| PCS-ARCH-004 | complete (current persistence) | immutability contract | SQL triggers protect published model/items/content/revisions/snapshots | `postgres-integration.mjs` exercises actual rejection behavior |
| PCS-ARCH-005 | complete (foundation) | ADR-0001 migration/rollback policy | ordered committed SQL migrations | migration validator + PostgreSQL application in CI; deployment backup rehearsal is OPS |
| PCS-QA-001 | complete | `10_TESTING_QA.md` | `.github/workflows/ci.yml` | Item Bank → migration validation → PostgreSQL integration → domain tests → typecheck → build |
| PCS-QA-002 | complete (current domain pipeline) | result/scoring/code requirements | full current domain engine | scoring/code/interaction/composer/result/snapshot suites |
| PCS-QA-003 | complete (development fixture) | Golden snapshot rule | `golden-result-snapshot-midpoint-v0.1.json` | exact equality + answer-order invariance tests |

## Phase 2 persistence evidence

### Architecture/data

- `docs/adr/ADR-0001-persistence-postgresql-drizzle.md`
- `src/infrastructure/persistence/schema.ts`
- `src/infrastructure/persistence/database.ts`
- `src/infrastructure/persistence/sessionToken.ts`
- `src/infrastructure/persistence/anonymousAssessmentRepository.ts`
- `drizzle/0000_phase2b_persistence.sql`
- `drizzle/0001_phase2b_immutability_hardening.sql`
- `docs/model/PERSISTENCE_RETENTION_BASELINE_v0.1.md`

### Verification

- `scripts/validate-persistence-schema.mjs` validates the ordered migration contract and required guards.
- `tests/infrastructure/postgres-integration.mjs` applies migrations to a real PostgreSQL 16 database and proves DB invariants.
- `tests/infrastructure/anonymous-assessment-repository.integration.test.ts` proves the typed adapter issues a hash-only anonymous session, persists an answer, transactionally finalizes scores/snapshot/completion, retrieves the private result, and rejects post-completion writes.
- Current CI provisions PostgreSQL 16 for every push/PR before domain/type/build gates.

## Current CI evidence

Recent successful checkpoints include:

- reviewed Item Bank v0.2: complete 147-item disposition/validator suite;
- Core/Extended Code: deterministic C01D/PCSX1 suite;
- Phase 2A: interaction/composer/structured-result + fixed Golden Snapshot suite;
- Phase 2B hardening: real PostgreSQL migration/invariant integration;
- Phase 2B adapter: anonymous persistence repository integration plus full regression/type/build pipeline.

CI success verifies software/data-contract invariants only. It is not evidence of psychological construct validity.

## Status vocabulary

- **complete (policy):** governance definition is finished; later runtime controls may have separate requirements.
- **complete (conceptual):** current design artifact is sufficient for its phase, without empirical-validation implication.
- **complete (candidate authoring):** candidate artifact exists and is machine checked.
- **complete (editorial review):** every item has an explicit recorded wording/construct-purity disposition; beta evidence still pending.
- **complete (development engine/spec):** deterministic engineering contract/implementation exists but may be intentionally non-public/experimental.
- **complete (Phase 2B foundation):** persistence architecture/adapter/invariants are implemented and integration-tested; deployment/public-share/legal concerns remain their later gates.
- **complete:** requirement itself is fulfilled.
- **active invariant:** continuously enforced rule.
- **partial:** some clauses satisfied; checkbox remains open.
- **pending:** not yet implemented/completed.

## Update rule

Whenever a requirement becomes checked in `REQUIREMENTS.md`, this table must be updated in the same change set with exact evidence. Future phases add implementation paths/test IDs/release artifacts without deleting historical evidence.
