# Scoring Specification v0.1

> Status: development scoring contract for candidate-bank integration
> Date: 2026-08-26
> Item bank: `item-bank-v0.1`
> Trait dictionary: v0.2

## 1. Scope

This specification defines deterministic Trait Vector scoring only. It does **not** freeze Core Type dimensions or claim psychometric validity.

## 2. Input contract

Each scoring item supplies:

- immutable item ID;
- primary Trait ID;
- key direction: `+1` or `-1`;
- positive integer `weightMilli` (v0.1 uses 1000 = weight 1.0);
- required flag.

Each answer supplies:

- item ID;
- Likert value 1..5.

For the initial model all active items are required. Unknown IDs, duplicates, invalid values, and missing required responses are hard errors.

## 3. Keyed contribution

Convert every response to a 0..4 construct-direction contribution:

For positive-keyed item:

`points = response - 1`

For reverse-keyed item:

`points = 5 - response`

Weighted contribution:

`weighted_points = points × weightMilli`

Maximum weighted contribution per item:

`max_weighted_points = 4 × weightMilli`

## 4. Canonical normalization

For each trait:

`score_bp = round_half_up(sum(weighted_points) × 10000 / sum(max_weighted_points))`

`score_bp` is the canonical score and is an integer from 0 through 10000.

- `0` = 0.00
- `5000` = 50.00
- `10000` = 100.00

The UI may show a whole-number 0..100 score using deterministic half-up rounding, but stored/reproduced scoring uses `score_bp`.

Why basis points:

- avoids treating an imprecise display float as the source of truth;
- allows exact equality tests;
- gives enough resolution for later weighted item models;
- keeps scoring independent of UI formatting.

## 5. Rounding

Only non-negative integer arithmetic is used for canonical normalization. Round-half-up is defined explicitly and must be tested. Intermediate weighted sums remain integers.

No locale, browser, screen width, answer order, item order, current time, user identity, random number, or external service may influence the result.

## 6. Candidate-bank v0.1 theoretical range

Every current trait contains seven weight-1.0 items:

- 4 positive-keyed;
- 3 reverse-keyed;
- raw keyed point range 0..28;
- canonical normalized range 0..10000 bp.

Examples for the current 4-positive/3-reverse layout:

- keyed minimum answers → 0.00;
- all midpoint (`3`) → 50.00;
- keyed maximum answers → 100.00;
- selecting raw response `1` for every item → 42.86 because reverse-keyed items contribute high construct-direction points;
- selecting raw response `5` for every item → 57.14.

## 7. Response-quality metadata v0.1

Response-quality metadata is separate from trait scoring and never changes Trait Scores in v0.1.

Current deterministic fields:

- answer count;
- count of each response value 1..5;
- dominant-response share in basis points;
- extreme-response (1 or 5) share in basis points;
- `dominant_response_pattern` flag when one response value is at least 90% of answers;
- `all_midpoint_responses` flag when every answer is 3.

These flags mean only that a response pattern may provide less measurement information. They MUST NOT be displayed as "lying", "fake", "dishonest", or similar.

Future consistency/timing signals require their own versioned definitions and must not be silently added to historical results.

## 8. Missing data

Candidate/initial active model policy: no missing responses in a completed result.

If optional/skip behavior is introduced later, it requires a new scoring-model version with explicit denominator/minimum-response rules.

## 9. Determinism tests

Required golden tests include:

- keyed minimum = 0;
- all midpoint = 5000 bp;
- keyed maximum = 10000 bp;
- raw all-min/all-max fixtures proving reverse keys are applied;
- mixed manually calculated fixture;
- item and answer ordering invariance;
- duplicate answer rejection;
- unknown item rejection;
- missing required answer rejection;
- repeated execution exact equality.

## 10. Weight changes

Current candidate items have source weight `1.0`, represented as `weightMilli = 1000` in the scorer.

If item weights change after calibration:

- weights must be versioned;
- runtime weights remain positive integers in a declared weight unit;
- old scoring-model fixtures remain executable;
- historical result snapshots are never recomputed under new weights unless explicitly requested as a new result.

## 11. Core Type boundary

Trait scoring and Core Type classification are separate stages.

No v0.1 scoring result may infer a Core Type until a versioned Core Code specification defines:

- which measured dimensions participate;
- thresholds/boundaries;
- tie/boundary behavior;
- code-symbol semantics;
- model version.

The target number of public types must not dictate the measured trait structure.