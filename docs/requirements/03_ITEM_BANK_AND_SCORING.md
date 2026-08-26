# 03 — Item Bank and Scoring Requirements

## Current candidate bank

Authoritative candidate-bank artifacts:

- `data/item-bank/v0.1/manifest.json`
- `data/item-bank/v0.1/cognitive.json`
- `data/item-bank/v0.1/affect-relational.json`
- `data/item-bank/v0.1/action-risk.json`
- `data/item-bank/v0.1/resilience-creativity.json`
- `docs/model/ITEM_BANK_REVIEW_v0.1.md`
- `scripts/validate-item-bank.mjs`

Current inventory: 21 retained traits × 7 items = 147 Japanese (`ja-JP`) draft candidate items, with 4 positive-keyed and 3 reverse-keyed items per trait.

## Item bank

Each retained trait SHOULD begin with 6–8 candidate items before empirical pruning. Final item count may vary by trait based on reliability and discrimination.

Every item record MUST contain:

- immutable item ID;
- revision/version ID;
- text by locale;
- keyed trait(s); normally one primary construct;
- key direction;
- scoring weight if not 1.0;
- lifecycle status (`draft`, `reviewed`, `beta`, `active`, `retired`);
- rationale/notes;
- discriminant-neighbor metadata where relevant;
- created/retired model versions.

The candidate bank satisfies this record shape. All current items remain `draft` until the dedicated review disposition pass is complete.

## Item writing constraints

Items MUST:

- express one behavioral proposition;
- avoid specialist jargon;
- avoid moral superiority/desirability framing;
- avoid obvious type names/codes;
- avoid double-barreled claims;
- avoid absolutes unless deliberately measuring extremity;
- be understandable in isolation;
- avoid unnecessary demographic/cultural specificity.

Counter-keyed items MAY be used, but confusing negation solely for reverse scoring is prohibited.

## High-overlap discriminant controls

For conceptual high-overlap pairs, the candidate bank MUST contain explicit discriminant coverage on both sides:

- VER ↔ ADV
- EMO ↔ COG
- OPT ↔ FIN
- RSK ↔ UNC

CI currently requires at least two items on each side explicitly tagged against the neighboring high-overlap trait.

## Response scale

Initial standard: five-point agreement scale, versioned in the item-bank manifest.

Current `likert-5-ja-v0.1` mapping:

1. まったく当てはまらない
2. あまり当てはまらない
3. どちらともいえない
4. やや当てはまる
5. とても当てはまる

The displayed labels and numeric mapping MUST be versioned. UI order must remain semantically stable across desktop/mobile.

Assessment results MUST NOT depend on screen width, interaction method, or answer-option DOM order.

## Completion policy

For initial v1 scoring:

- active required items must be answered before final scoring;
- navigation back/edit is allowed before final submission;
- if optional/skip behavior is later introduced, missing-data rules require a new scoring specification/version;
- abandoned sessions must never be converted into complete results.

## Deterministic scoring

The scoring engine MUST be pure with respect to:

`assessment model + active item revisions + answer set -> raw scores -> normalized trait scores -> quality metadata`

No random number, current time, user identity, IP, browser, or external service may affect the score.

## Normalization

For every trait, the specification MUST define:

- contributing items;
- key directions;
- weights;
- theoretical raw minimum/maximum;
- normalization formula to 0–100;
- rounding rule;
- minimum valid response condition.

Rounding MUST occur at defined output boundaries; intermediate calculations SHOULD preserve precision.

## Confidence / response-quality metadata

Potential signals:

- within-construct inconsistency;
- paired/counter-keyed inconsistency;
- straight-line responding;
- implausibly fast timing patterns;
- missing/invalid responses;
- completion interruptions if methodologically useful.

Rules:

- MUST be deterministic/versioned.
- MUST NOT label a user as lying/deceptive.
- MUST NOT secretly alter trait scores unless the scoring specification explicitly defines such behavior.
- SHOULD normally be reported separately as measurement confidence/response quality.

## Candidate-bank CI validation

`npm run validate:item-bank` MUST fail on at least:

- invalid JSON;
- duplicate item IDs;
- duplicate item text;
- missing required item metadata;
- unknown trait IDs/discriminant targets;
- incorrect total item count;
- incorrect per-trait item count;
- incorrect positive/reverse direction balance;
- insufficient tagged discriminant items for high-overlap pairs.

This validator protects the authoring contract; it does not validate psychological quality.

## Scoring tests

Before an assessment model is publishable:

- exact fixtures for all-min/all-mid/all-max answer sets;
- mixed-answer fixtures with manually verified expected scores;
- counter-keyed item fixtures;
- invalid/missing input rejection tests;
- ordering invariance tests;
- repeated execution equality tests;
- serialization/deserialization equality tests;
- previous model fixture regression tests.

## Versioning

Changing any of the following requires a new assessment/scoring model version unless proven output-equivalent:

- active item membership;
- item wording when semantic meaning changes;
- key direction;
- weights;
- normalization;
- required completion rules;
- confidence algorithm if displayed interpretation changes.

Old model fixtures MUST remain runnable so historical result snapshots can be reproduced/audited.

## Current requirement status

- `PCS-SCORE-001` — complete: 7 candidate items for every retained trait.
- `PCS-SCORE-002` — pending: separate full wording/disposition review is required; items remain `draft`.
- `PCS-SCORE-003` — partial: IDs/revisions are present; release lifecycle/formal active-model version procedure remains to be finalized.
- `PCS-SCORE-004..006` — pending until scoring specification/engine phase.