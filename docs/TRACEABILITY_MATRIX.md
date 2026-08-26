# Requirements Traceability Matrix

> Status: active from Phase 1 onward
> Last updated: 2026-08-26

A checkbox in `REQUIREMENTS.md` is marked complete only when inspectable specification/implementation/verification evidence exists. `complete` never implies psychometric validation unless the requirement explicitly concerns validation evidence.

| Requirement | Status | Specification / Evidence | Implementation | Verification |
| --- | --- | --- | --- | --- |
| PCS-GOV-001..010 | complete (policy) | `REQUIREMENTS.md`, `docs/requirements/00_GOVERNANCE.md` | runtime controls progressively implemented | document precedence + CI/runtime architecture |
| PCS-DIAG-001 | complete (conceptual) | `docs/model/TRAIT_DICTIONARY_v0.2.md` | n/a | 21 retained Traits each define poles, boundaries, anchors, overlaps/domains |
| PCS-DIAG-002 | complete (conceptual) | `docs/model/TRAIT_OVERLAP_MATRIX_v0.2.md` | n/a | full retained-pair review; LDR/DEL/TRN removed from direct scoring |
| PCS-DIAG-003 | complete | Trait Dictionary §presentation domains | result composer pending | domains explicitly views, not presumed independent latent factors |
| PCS-DIAG-004 | complete (hypothesis spec) | `docs/model/TRAIT_INTERACTIONS_v0.1.md` | executable interaction engine pending | 20 versioned deterministic conditions + precedence/suppression metadata |
| PCS-DIAG-005 | complete (policy) | `docs/model/VALIDATION_GATES_v0.1.md` | n/a | experimental/beta/stable/validated gates and prohibited claims defined |
| PCS-SCORE-001 | complete (candidate authoring) | `data/item-bank/v0.1/*`, `ITEM_BANK_REVIEW_v0.1.md` | machine-readable bank | `validate-item-bank.mjs`: 147 / 21 / 7 each / 4+3 direction |
| PCS-SCORE-002 | complete (editorial review) | `data/item-bank/v0.2/review.json`, `ITEM_BANK_REVIEW_v0.2.md` | `reviewedItemBank.ts` materialization | v0.2 validator + reviewed-bank tests: 98 accept / 39 r2 / 10 beta-hold; one disposition each; scoring keys invariant |
| PCS-SCORE-003 | partial | versioned v0.1/v0.2 manifests/revisions + scoring spec | active production model-release procedure pending | metadata/ledger validated in CI |
| PCS-SCORE-004 | complete (development engine) | `SCORING_SPEC_v0.1.md` | `src/domain/assessment/scoring.ts`, `itemBank.ts` | scoring/candidate/reviewed-bank domain tests; exact integer bp normalization |
| PCS-SCORE-005 | complete (v0.1 baseline) | `SCORING_SPEC_v0.1.md` §response quality | `computeResponseQuality` in `scoring.ts` | midpoint/dominant response-quality fixtures; metadata does not alter Trait Score |
| PCS-SCORE-006 | complete (current layer) | scoring golden-fixture requirements | `tests/domain/scoring.test.ts`, `candidate-bank.test.ts`, `reviewed-item-bank.test.ts` | min/mid/max, reverse keys, manual mixed, order invariance, invalid input, reviewed-bank endpoints |
| PCS-RESULT-001 | complete (experimental engineering spec) | `CORE_CODE_SPEC_v0.1-dev.md`, `data/code-schema/v0.1-dev.json` | `personalityCode.ts` | `personality-code.test.ts`; C01D explicitly `public_use=false` |
| PCS-RESULT-002 | complete (experimental engineering spec) | `CORE_CODE_SPEC_v0.1-dev.md` Extended Code section | `generatePersonalityCode`, `traitBandFromScoreBp` | exact band boundaries, canonical Trait order, input-order invariance, missing/duplicate rejection |
| PCS-RESULT-003 | pending | `docs/requirements/04_CODE_AND_RESULT_ENGINE.md` | content module/composer pending | pending |
| PCS-RESULT-004 | pending implementation | interaction/precedence specs | suppression composer pending | contradiction fixture suite pending |
| PCS-RESULT-005 | pending implementation | snapshot requirements | persistence pending Phase 2B | snapshot reproducibility tests pending |
| PCS-ARCH-001 | complete (domain isolation) | `docs/requirements/07_APPLICATION_ARCHITECTURE_AND_DATA.md` | `src/domain/assessment/*` contains no Next.js/React dependency | compiled/tested by `test:domain` independent of UI |
| PCS-QA-001 | complete | CI workflow | GitHub Actions | current pipeline: author/review validators → domain tests → typecheck → production build |

## Current CI evidence

Recent successful checkpoints:

- reviewed Item Bank v0.2 commit `447dad4e25514b281dca8e4f46dd499fea82f8e8`: validators, domain tests, typecheck, production build all passed;
- Core/Extended Code commit `6065b3984f892789cb8b01708192d777892e1b23`: validators, expanded domain tests, typecheck, production build all passed.

CI success verifies software/data-contract invariants only. It is not evidence of psychological construct validity.

## Status vocabulary

- **complete (policy):** governance definition is finished; later runtime controls may have separate requirements.
- **complete (conceptual):** current design artifact is sufficient for its phase, without empirical-validation implication.
- **complete (candidate authoring):** candidate artifact exists and is machine checked.
- **complete (editorial review):** every item has an explicit recorded wording/construct-purity disposition; beta evidence still pending.
- **complete (development engine/spec):** deterministic engineering contract/implementation exists but may be intentionally non-public/experimental.
- **complete:** requirement itself is fulfilled.
- **active invariant:** continuously enforced rule.
- **partial:** some clauses satisfied; checkbox remains open.
- **pending:** not yet implemented/completed.

## Update rule

Whenever a requirement becomes checked in `REQUIREMENTS.md`, this table must be updated in the same change set with exact evidence. Future phases add implementation paths/test IDs/release artifacts without deleting historical evidence.
