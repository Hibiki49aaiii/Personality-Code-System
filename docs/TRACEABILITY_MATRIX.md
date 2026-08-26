# Requirements Traceability Matrix

> Status: active from Phase 1 onward
> Last updated: 2026-08-26

This file maps completed/active requirements to evidence. A checkbox in `REQUIREMENTS.md` should not be marked complete without inspectable evidence.

| Requirement | Status | Specification / Evidence | Implementation | Verification |
| --- | --- | --- | --- | --- |
| PCS-GOV-001..010 | complete (policy) | `REQUIREMENTS.md`, `docs/requirements/00_GOVERNANCE.md` | runtime enforcement pending where applicable | document review |
| PCS-DIAG-001 | complete (conceptual) | `docs/model/TRAIT_DICTIONARY_v0.2.md` | n/a | 21 retained traits contain definitions, poles, boundaries, 10/30/50/70/90 anchors |
| PCS-DIAG-002 | complete (conceptual) | `docs/model/TRAIT_OVERLAP_MATRIX_v0.2.md` | n/a | all retained pairs classified; H/M pairs have distinction rules; LDR/DEL/TRN removed from direct set |
| PCS-DIAG-003 | complete | `docs/model/TRAIT_DICTIONARY_v0.2.md` §3, `docs/DIAGNOSTIC_MODEL.md` | result engine pending | domains explicitly defined as presentation views, not independent latent traits |
| PCS-DIAG-004 | complete (hypothesis spec) | `docs/model/TRAIT_INTERACTIONS_v0.1.md` | result engine pending | 20 deterministic interaction rules with suppression/precedence metadata |
| PCS-DIAG-005 | complete (policy) | `docs/model/VALIDATION_GATES_v0.1.md` | n/a | evidence stages and prohibited validation claims defined |
| PCS-DIAG-010 | complete (conceptual) | `docs/model/TRAIT_OVERLAP_MATRIX_v0.2.md` | n/a | full triangular pairwise matrix |
| PCS-DIAG-011 | complete (conceptual) | `docs/model/TRAIT_OVERLAP_MATRIX_v0.2.md` | n/a | high-overlap pairs justified; three candidates removed from direct scoring |
| PCS-DIAG-012 | active invariant | `docs/requirements/02_DIAGNOSTIC_MODEL.md` | future calibration | merge decisions require theory + item content + empirical evidence |
| PCS-SCORE-001 | complete (candidate authoring) | `data/item-bank/v0.1/*.json`, `docs/model/ITEM_BANK_REVIEW_v0.1.md` | machine-readable candidate bank | `scripts/validate-item-bank.mjs` verifies 147 items, 21 traits, 7/trait, 4 positive + 3 reverse |
| PCS-SCORE-002 | pending | `docs/model/ITEM_BANK_REVIEW_v0.1.md` | items remain `draft` | full per-item disposition review required |
| PCS-SCORE-003 | partial | item IDs/revisions in `data/item-bank/v0.1/*.json` | formal item/model release procedure pending | CI validates current metadata shape |

## Status vocabulary

- **complete (policy):** requirement definition/governance is finished; later runtime controls may separately exist.
- **complete (conceptual):** design artifact satisfies the current phase, but empirical validation is explicitly not implied.
- **complete (candidate authoring):** required candidate artifact exists and is machine-checked, but review/beta evidence is not implied.
- **complete:** requirement itself is fulfilled.
- **active invariant:** continuously enforced rule, not a one-time task.
- **partial:** some requirement clauses are satisfied; checkbox remains open until the whole requirement is complete.
- **pending:** not completed.

## Update rule

Whenever a requirement becomes checked in `REQUIREMENTS.md`, update this table in the same change set with the exact file/test/report that proves completion. Later phases should add implementation paths and automated test IDs rather than replacing historical specification evidence.