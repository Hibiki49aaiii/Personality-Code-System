# BETA_CALIBRATION_PROTOCOL_v0.1

> Status: planning-only / no calibration collection enabled
> Protocol: `beta-calibration-protocol-v0.1-dev`
> Locale scope: `ja-JP`
> Date: 2026-08-27

## Purpose

Define the evidence and governance PCS needs **before** closed-beta psychometric collection begins. The goal is to prevent the beta dataset from becoming an improvised source of post-hoc thresholds, silent item changes, or premature validation claims.

This protocol does not activate collection and does not authorize raw-answer export.

## Activation boundary

Phase 5A collection cannot start until all of the following exist and are reviewed together:

1. explicit calibration participation/consent state separate from ordinary assessment completion;
2. versioned consent-purpose text;
3. legal/privacy approval for the deployed jurisdiction;
4. development/preview/production environment separation;
5. retention/deletion behavior for calibration records;
6. operator authorization and export/audit controls;
7. a pre-registered sample-size/analysis plan;
8. frozen assessment/item/scoring/version scope for the collection wave.

Until then, `collection_enabled=false` and `export_enabled=false` are machine-enforced.

## Version scope

Every beta wave must identify the exact:

- assessment model version;
- item bank version;
- scoring version;
- Trait Dictionary version;
- locale.

Data from incompatible versions must not be silently pooled for confirmatory claims.

## Planned analysis bundle

### Item behavior

Review:

- response distributions;
- floor/ceiling concentration;
- pathological skew;
- missing/invalid patterns;
- item-total and scale behavior;
- candidate redundancy.

### Reliability

Primary internal-consistency review uses McDonald's omega where appropriate; alpha may be supplementary. No single coefficient is a pass/fail oracle.

### Trait overlap and structure

Review:

- inter-Trait correlations;
- nearest-neighbor/discriminant behavior;
- exploratory factor structure;
- held-out/confirmatory structural review when the sample supports it;
- whether a Trait should be narrowed, merged, or removed even if doing so changes the desired marketing type count.

### Retest

Before collection begins, freeze:

- retest interval;
- attrition/exclusion handling;
- major context/life-change recording;
- exact model linkage.

Report both rank-order stability and systematic score shifts where appropriate.

### DIF / invariance

DIF and measurement-invariance work is conditional on adequate subgroup sample size and ethically justified demographic collection. It is not a reason to collect unnecessary demographics by default.

## Sample-size rule

The protocol intentionally contains **no universal numeric minimum N**.

Before activation, the analysis plan must justify sample size against:

- item/model dimensionality;
- precision/uncertainty targets;
- planned factor analysis complexity;
- expected retest attrition;
- any subgroup/DIF scope.

The justification must be written before using the final confirmation dataset where practical.

## Model-change ledger

Every beta-driven item or scoring change must record:

- old version;
- new version;
- changed item/weight/rule;
- evidence that triggered review;
- editorial/measurement rationale;
- impact on historical reproducibility;
- whether prior beta data remain comparable.

A beta wave does not mutate an already published/frozen model in place.

## Promotion boundary

Stage promotion is evidence-bundle based.

No single omega, alpha, factor-fit index, p-value, completion metric, or type-frequency statistic may promote the model by itself.

A stable-model review requires the outputs already listed in `VALIDATION_GATES_v0.1.md`, including reliability, retest, structural, overlap/discriminant, change-ledger, version-scope and limitations evidence.

## Separation from product analytics

`product_events` remains product analytics and is not psychometric calibration data. Funnel events cannot be reverse-engineered into an answer dataset.

Answer-level calibration use requires the separately gated consented path defined by `CALIBRATION_EXPORT_SPEC_v0.1.md`.

## Public claims

During this protocol state:

- public validation claims are prohibited;
- rarity/population claims remain prohibited except scoped observed-sample statistics under their separate policy;
- C01D remains an experimental engineering schema;
- a polished 64-type catalog does not count as psychometric evidence.

## Automated evidence

`scripts/validate-calibration-protocol.mjs` fails CI if collection/export/public-validation claims are enabled, required activation prerequisites disappear, the analysis bundle is weakened, a universal sample magic number is inserted, or versioned change control is disabled.
