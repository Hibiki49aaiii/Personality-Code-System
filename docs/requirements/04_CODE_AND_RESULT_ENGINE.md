# 04 — Personality Code and Result Engine Requirements

## Purpose

Defines how deterministic Trait Scores become a memorable Personality Code and later a contradiction-safe detailed result without free-form AI interpretation.

## Authoritative top-level requirement IDs

These IDs MUST retain the same meaning as `REQUIREMENTS.md`:

- **PCS-RESULT-001 — Core Code specification:** define interpretable measured dimensions/classification rules and every public code symbol's semantics.
- **PCS-RESULT-002 — Extended Code specification:** define parseable syntax, ordering, ranges/bands, versioning, and backward behavior.
- **PCS-RESULT-003 — Deterministic content selection:** select result modules from structured versioned diagnostic output only.
- **PCS-RESULT-004 — Contradiction prevention:** deterministic precedence/suppression must prevent materially conflicting claims.
- **PCS-RESULT-005 — Immutable result snapshots:** persist enough structured/version metadata to reproduce a finalized displayed result.

Detailed clauses use 010/020/etc. IDs and MUST NOT redefine 001–005.

## Core Code — PCS-RESULT-001

Current engineering artifacts:

- `data/code-schema/v0.1-dev.json`;
- `docs/model/CORE_CODE_SPEC_v0.1-dev.md`;
- `src/domain/assessment/personalityCode.ts`;
- `tests/domain/personality-code.test.ts`.

`core-code-v0.1-dev` / token `C01D` is an **experimental engineering schema** with `public_use=false`. It allows deterministic implementation/testing before closed-beta evidence freezes the public identity system.

### Detailed Core Code clauses

- **PCS-RESULT-010** Every code position has one documented measured source or deterministic classification rule.
- **PCS-RESULT-011** Every symbol/pole has documented non-moral semantics.
- **PCS-RESULT-012** Axis ordering, thresholds, symbols, tie rule, and boundary-margin interpretation are versioned.
- **PCS-RESULT-013** The number of theoretical combinations is a consequence of the code schema and MUST NOT dictate the measured Trait model.
- **PCS-RESULT-014** Near-boundary scores are handled deterministically and separately from character selection confidence/strength metadata.
- **PCS-RESULT-015** Human-readable type names are presentation metadata and MUST NOT silently alter code semantics.
- **PCS-RESULT-016** A development schema with `public_use=false` MUST NOT be advertised as the final public Personality Code taxonomy.

### Current v0.1-dev Core anchors

The development schema uses six directly measured Trait anchors instead of inventing unvalidated composite latent factors:

1. SYS — `S/L`;
2. VER — `V/T`;
3. AUT — `A/G`;
4. EXE — `E/P`;
5. NOV — `N/F`;
6. RDP — `D/B`.

Threshold is `5000 score_bp` in C01D. `score_bp >= threshold` deterministically selects the high symbol. No random tie-breaking exists.

`abs(score_bp - threshold_bp) <= 500` is recorded as near-boundary metadata but does not change the selected symbol.

Theoretical C01D combinations = 64. This does **not** imply that PCS scientifically contains 64 personality species, nor that 64 drove the 21-Trait measurement model.

## Extended Code — PCS-RESULT-002

Current development format: `PCSX1`.

Grammar:

`PCSX1~<schema_token>~<core_code>~<TRAIT><band>.<TRAIT><band>...`

All 21 retained Traits appear exactly once in a canonical order. Current five score bands use `score_bp` boundaries `2000 / 4000 / 6000 / 8000`.

### Detailed Extended Code clauses

- **PCS-RESULT-020** Syntax/version prefix is explicit and machine parseable.
- **PCS-RESULT-021** Trait ordering is canonical and versioned.
- **PCS-RESULT-022** Band/range boundaries and boundary inclusion rules are explicit/versioned.
- **PCS-RESULT-023** Missing required Trait data fails rather than silently defaulting.
- **PCS-RESULT-024** Stored canonical Trait Scores remain source of truth; Extended Code is a reproducible interchange/identity representation.
- **PCS-RESULT-025** Changing grammar/order/bands requires a new code-schema/format version under the documented compatibility policy.

## Code-generation determinism

Given identical Trait Scores and identical code schema:

- Core Code MUST be byte-for-byte identical;
- per-axis metadata MUST be identical;
- Extended Code MUST be byte-for-byte identical;
- input Trait Score ordering MUST NOT affect output;
- duplicate, missing, or out-of-range Trait Scores MUST fail;
- no time/random/user/browser/external service input may affect output.

Current CI tests exact midpoint/tie behavior, low/high pole selection, band boundaries, ordering invariance, missing Trait rejection, and duplicate Trait rejection.

## Public-code freeze gate

Before any schema becomes `public_use=true`, review at minimum:

- test-retest stability of proposed Core anchors;
- item/Trait distribution and floor/ceiling behavior;
- near-boundary flip rate;
- empirical redundancy/factor evidence;
- whether 50.00 or another threshold has defensible behavior;
- Japanese/English pole-label comprehension without value judgment;
- whether another retained Trait produces better public identity coverage.

A changed public decision creates a new schema version; C01D historical semantics are not rewritten.

## Deterministic content engine — PCS-RESULT-003

Result composition consumes only versioned structured output such as:

- assessment/scoring version;
- code-schema version;
- canonical Trait Scores;
- interaction-rule flags/version;
- response-quality/confidence metadata;
- Core/Extended Code;
- locale;
- content version.

Raw free-text user interpretation is not a required input.

Every result block MUST originate from a versioned content module/template. Suggested module metadata:

- module ID;
- locale;
- domain;
- activation rule;
- priority;
- assertion tags;
- suppression/conflict tags;
- evidence/status metadata;
- content version.

**Current status:** specification exists; runtime content-module selection is not yet implemented.

## Contradiction prevention — PCS-RESULT-004

Current rule precedence:

1. explicit safety/limitation copy;
2. approved multi-Trait interaction module;
3. Core Type integrated module;
4. single-Trait extreme module;
5. single-Trait general module;
6. neutral/fallback module.

A higher-priority module may suppress a lower-priority claim only through explicit rule/claim metadata.

Example: high OPT generic copy must not say a person cannot stop when the high-OPT + high-FIN `Disciplined Optimizer` interaction is active.

Interaction hypotheses/thresholds are versioned in `docs/model/TRAIT_INTERACTIONS_v0.1.md`.

**Current status:** contradiction rules are specified; enforcement/content composer is not yet implemented.

## Required result domains

The result schema must support:

- core identity;
- Trait overview;
- thinking;
- emotion;
- action;
- relationships/love;
- work;
- stress;
- communication;
- decision making;
- learning;
- leadership-derived profile;
- risk;
- creativity;
- hidden strengths;
- adversarial/failure-mode analysis;
- growth guidance;
- personal manual summary.

Presentation domains are views over measured Traits/interactions, not automatically separate latent factors.

## Adversarial analysis rules

Adversarial analysis MUST:

- show how measured strengths/tendencies can become liabilities under extremes or combinations;
- distinguish tendency from certainty;
- avoid insults, diagnosis, moral judgment, or deterministic predictions;
- use the same structured measurements as the normal profile;
- never invent unrelated weaknesses for entertainment.

## Result snapshots — PCS-RESULT-005

A finalized result snapshot must retain enough metadata to reproduce what the user saw:

- assessment model version;
- item-bank/scoring version;
- code-schema version;
- interaction-rule version;
- content version;
- illustration asset/version reference;
- canonical structured Trait Scores;
- Core/Extended Code;
- selected module IDs/order/suppression result;
- displayed response-quality interpretation where applicable.

Historical snapshots MUST NOT silently change when current scoring, code, copy, or artwork changes.

**Current status:** snapshot requirements are specified; persistence implementation is pending Phase 2B/2C.

## Current requirement status

- **PCS-RESULT-001 — COMPLETE as experimental engineering specification:** C01D is deterministic, documented, implemented, tested, and explicitly non-public.
- **PCS-RESULT-002 — COMPLETE as experimental engineering specification:** PCSX1 syntax/bands/order/version behavior are deterministic, documented, implemented, and tested.
- **PCS-RESULT-003 — PENDING IMPLEMENTATION:** content module model/composer required.
- **PCS-RESULT-004 — PENDING IMPLEMENTATION:** precedence exists in specification but must be enforced/tested by the composer.
- **PCS-RESULT-005 — PENDING IMPLEMENTATION:** immutable persistence/result snapshot schema required.
