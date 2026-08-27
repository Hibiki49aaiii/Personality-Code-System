# 03 — Item Bank and Scoring Requirements

## Purpose

Defines the versioned question bank, response scale, deterministic Trait Vector scoring, and response-quality metadata independently from UI and result prose.

## Current reviewed candidate bank

Authoritative artifacts:

- `data/item-bank/v0.1/*` — immutable authored draft snapshot;
- `data/item-bank/v0.2/manifest.json` — reviewed-bank manifest;
- `data/item-bank/v0.2/review.json` — complete per-item disposition/revision ledger;
- `docs/model/ITEM_BANK_REVIEW_v0.1.md` — authoring record;
- `docs/model/ITEM_BANK_REVIEW_v0.2.md` — complete wording/construct-purity review;
- `scripts/validate-item-bank.mjs`;
- `scripts/validate-reviewed-item-bank.mjs`.

Inventory remains 21 retained traits × 7 items = 147 Japanese (`ja-JP`) candidate items with 4 positive-keyed and 3 reverse-keyed items per trait.

The reviewed v0.2 materialization contains:

- 98 `accept-r1`;
- 39 `revise-r2`;
- 10 `hold-for-beta`;
- 0 rejected items.

`reviewed` means the dedicated editorial/construct-purity pass is complete. It does **not** mean statistically calibrated, validated, or production-active.

## Item record contract

Every candidate/active item MUST retain:

- immutable item ID;
- semantic revision ID;
- locale text;
- one primary scoring Trait unless a future model explicitly defines otherwise;
- key direction;
- scoring weight;
- lifecycle (`draft`, `reviewed`, `beta`, `active`, `retired`);
- rationale/notes;
- discriminant-neighbor metadata where relevant;
- introducing/model version metadata.

Semantic wording changes create a new revision. Historical wording is never overwritten.

## Item-writing constraints

Items MUST:

- express one behavioral proposition;
- avoid specialist jargon;
- avoid moral-superiority/desirability framing;
- avoid obvious type names/codes;
- avoid unnecessary double-barreling;
- avoid absolutes unless intentionally measuring extremity;
- be understandable in isolation;
- avoid unnecessary demographic/cultural specificity;
- provide a plausible non-pathological interpretation for either pole.

Counter-keyed items MAY be used, but confusing negation solely to manufacture reverse scoring is prohibited.

## High-overlap discriminant controls

Explicit two-sided discriminant coverage is required for the conceptual high-overlap pairs:

- VER ↔ ADV;
- EMO ↔ COG;
- OPT ↔ FIN;
- RSK ↔ UNC.

Tagged coverage is a design safeguard, not proof of discriminant validity. Beta data must still evaluate cross-trait behavior.

## Response scale

Current version: `likert-5-ja-v0.1`.

1. まったく当てはまらない
2. あまり当てはまらない
3. どちらともいえない
4. やや当てはまる
5. とても当てはまる

Mapping and displayed labels are versioned. Assessment output MUST NOT depend on screen width, DOM order, pointer/keyboard input, or responsive layout.

## Completion policy

For the current development scoring contract:

- every active required item must be answered before final scoring;
- back/edit may occur before final submission;
- missing required answers are hard errors;
- abandoned sessions never become complete results;
- introducing skip/optional behavior requires an explicit new missing-data/scoring rule version.

## Deterministic scoring

Authoritative specification/implementation:

- `docs/model/SCORING_SPEC_v0.1.md`;
- `src/domain/assessment/scoring.ts`;
- `src/domain/assessment/itemBank.ts`.

Pure transformation:

`scoring model + scoring items + complete answer set -> Trait Scores + response-quality metadata`

No randomness, current time, user identity, IP address, browser, screen width, or external service may affect scoring.

### Keying

Five-point response maps to construct-direction points 0..4:

- positive item: `response - 1`;
- reverse item: `5 - response`.

### Canonical normalization

Weights are represented as positive integer `weightMilli` units (`1000 = 1.0` in the current model).

Per Trait:

`score_bp = round_half_up(sum(keyed_points × weightMilli) × 10000 / sum(4 × weightMilli))`

`score_bp` integer 0..10000 is canonical. UI 0..100 is a presentation derived by explicit deterministic rounding.

## Response-quality metadata

Current v0.1 implementation is deliberately modest and separate from Trait Scores:

- answer count;
- response-value counts;
- dominant-response share;
- extreme-response share;
- `dominant_response_pattern`;
- `all_midpoint_responses`.

These signals MUST NOT alter Trait Scores in v0.1 and MUST NOT be described as detecting lies, dishonesty, manipulation, or diagnosis validity.

Future timing, paired-consistency, reverse-item, or interruption signals require separately versioned definitions.

## Validation and tests

`npm run validate:item-bank` MUST validate both the immutable v0.1 authoring snapshot and the reviewed v0.2 layer.

Current machine checks include:

- JSON/required metadata;
- duplicate IDs/text;
- known Trait/discriminant IDs;
- 147 total / 21 Traits / 7 per Trait;
- 4 positive + 3 reverse per Trait;
- high-overlap tagged coverage;
- v0.2 one-and-only-one review disposition for all 147 items;
- exact disposition counts;
- review-layer preservation of ID, primary Trait, direction, and weight.

Domain tests include:

- theoretical keyed minimum = 0;
- all midpoint = 5000 bp;
- keyed maximum = 10000 bp;
- reverse-key fixtures;
- manually calculated mixed fixture;
- answer/item ordering invariance;
- invalid/missing/duplicate/unknown input rejection;
- reviewed-bank scoring invariance at midpoint/endpoints.

## Versioning

Changing any of the following normally requires a new assessment/scoring-model version unless output equivalence is explicitly proven and documented:

- active item membership;
- semantic item wording/revision;
- key direction;
- weights;
- normalization/rounding;
- response scale mapping;
- required-completion/missing-data policy;
- displayed response-quality interpretation.

Old model fixtures remain executable/readable for historical audit.

## Requirement status

- **PCS-SCORE-001 — COMPLETE:** 7 candidates exist for every retained Trait.
- **PCS-SCORE-002 — COMPLETE:** all 147 items have recorded v0.2 dispositions; 39 semantic revisions and 10 beta-watch items are explicitly documented.
- **PCS-SCORE-003 — PARTIAL:** item revisions and scoring contract are versioned, but a formal production `active` assessment-model release/freeze procedure remains required before public launch.
- **PCS-SCORE-004 — COMPLETE (development engine):** deterministic 0..10000 normalized Trait scoring implemented and tested.
- **PCS-SCORE-005 — COMPLETE (v0.1 baseline):** deterministic response-quality metadata implemented separately from scores; richer confidence evidence remains future-version work.
- **PCS-SCORE-006 — COMPLETE (current layer):** golden fixtures and invalid-input/order invariance tests exist and run in CI.


## Current release/freeze foundation

`docs/model/ASSESSMENT_MODEL_RELEASE_CONTRACT_v0.1.md` and `data/release/assessment-dev-v0.3.json` now bind the current 147-item development model to an explicit version tuple, migration/content compatibility checks, rollback behavior and production blockers. `scripts/validate-release-operations.mjs` prevents the development C01D beta manifest from being marked production/public activatable.

This advances Master **PCS-SCORE-003** but does not complete it: the final production active-model release/freeze cannot occur until the public code-model and Phase 5 evidence gates are satisfied.
