# Observed Type Distribution Specification v0.1

> Status: Phase 4B development foundation; public display remains disabled pending production model/public taxonomy and statistical-policy approval.
> Date: 2026-08-27
> Schema: `observed-type-distribution-v0.1-dev`

## Purpose

PCS may report how often a Core Code occurred **inside a precisely defined set of completed PCS assessments**. This statistic is an observed sample distribution, not a population prevalence estimate.

## Required scope

Every distribution is defined by all of:

- exact `assessmentModelVersion`;
- exact `codeSchemaVersion`;
- exact locale;
- start-inclusive timestamp;
- end-exclusive timestamp;
- explicit eligibility rule;
- sample size.

The development eligibility rule is:

`all-completed-snapshots`

This rule means every immutable result snapshot matching the exact model/code/locale/time filters is counted once.

## Prohibited interpretation

A PCS distribution MUST NOT be described as:

- “X% of humanity”;
- “X% of Japanese people”;
- “1 in N people” unless a separately validated representative-sampling study supports that population claim;
- a frequency derived by multiplying independent Trait probabilities;
- a 1/64 assumption;
- a frequency that silently mixes assessment model versions or code-schema meanings.

The domain output deliberately contains:

`populationClaimAllowed: false`

This is a machine-readable guard, not merely editorial guidance.

## Calculation

For each matching Core Code:

`share_bp = round(count / sampleSize × 10,000)`

Canonical stored/computed representation uses integer basis points. Display formatting may convert this to percent.

Rounding means displayed entry shares are not required to sum to exactly 10,000 bp.

## Empty sample

An empty valid scope returns:

- `sampleSize = 0`;
- no entries;
- `populationClaimAllowed = false`.

The UI must not invent a percentage for an empty sample.

## Example permitted wording

> PCS assessment-dev-v0.3 / ja-JP の対象期間内に完了した 12,481 件のうち、SVAEND は 2.4% でした。

Public production wording should replace development identifiers with approved human-readable model labels while retaining access to exact scope metadata.

## Example prohibited wording

> SVAEND は人口の0.12%しかいない希少タイプです。

unless a future representative external validation study explicitly supports that population-level estimate.

## Data source

Current development aggregation reads only immutable `result_snapshots`.

It does not use:

- abandoned assessments;
- theoretical code reachability;
- analytics click/view events;
- public-share views;
- duplicated share links.

## Versioning

Changes to any of the following require a new distribution schema/policy version:

- eligibility rule;
- denominator definition;
- rounding/canonical arithmetic;
- model mixing policy;
- validity exclusion rules;
- population-claim policy.

## Public-display policy foundation

A separate versioned policy now exists at `data/analytics/observed-distribution-publication-policy-v0.1-dev.json`.

The current development policy requires all of:

- assessment model status = `published`;
- code schema `public_use=true`;
- at least 1,000 assessments in the exact scope;
- at least 10 observations for the individual Core Code before its percentage is displayed;
- one decimal place for public percentage presentation;
- exact model/version, locale, time window and sample size in the statement;
- `populationClaimAllowed=false` remains invariant.

If any gate fails, the display contract returns `集計データ不足` instead of a percentage. These thresholds are conservative product privacy/stability display policy, not scientific validation or proof of representativeness.

Current C01D remains `public_use=false`, so the policy mechanically prevents its observed distribution from becoming public.

Domain implementation: `src/domain/analytics/observedDistributionPublication.ts`.
Validator: `scripts/validate-observed-distribution-publication.mjs`.

## Production gaps

Before this statistic is shown publicly:

1. production assessment/public Core Code schema must be frozen;
2. valid-assessment exclusion policy must be decided from beta/calibration evidence;
3. minimum sample/aggregation threshold is now specified in the development publication policy and must be reviewed against beta/production evidence;
4. privacy review for rare-code disclosure must confirm or revise the minimum-code-count policy;
5. user-facing copy contract now requires sample size/time/model/locale scope, but production UI remains disabled until the public model exists;
6. QA must verify no theoretical/population wording can be substituted in the final public surface.

Therefore the current implementation is an aggregation foundation and does **not** complete public `PCS-ANA-002`.
