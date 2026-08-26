# 03 — Item Bank and Scoring Requirements

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
- created/retired model versions.

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

## Response scale

Initial standard: five-point agreement scale.

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
