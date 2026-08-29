# Beta Wave JA-01 — Preregistration Draft

> Status: **registration-ready candidate / not externally preregistered**
>
> Wave: `beta-ja-wave-01-draft`
>
> Candidate assessment model: `assessment-dev-v0.3`
>
> Locale: `ja-JP`
>
> This document does not authorize participant collection or calibration export.

## 1. Purpose

Wave JA-01 is the first planned closed-beta psychometric calibration wave for the PCS Japanese development assessment.

The wave is intended to evaluate whether the current 147 candidate items and 21 proposed direct Traits behave well enough to justify item revision/pruning and a later model-freeze review.

It is **not** designed to prove that:
- PCS is scientifically validated;
- all 21 Traits must survive unchanged;
- C01D/64 combinations are a true population taxonomy;
- observed website participants represent the general population;
- a single reliability or fit statistic can promote the model.

## 2. Exact candidate version scope

The registration candidate is bound to:

| Component | Version |
| --- | --- |
| Assessment model | `assessment-dev-v0.3` |
| Item bank | `item-bank-v0.2` |
| Scoring | `scoring-v0.1-dev` |
| Trait Dictionary | `trait-dictionary-v0.2` |
| Locale | `ja-JP` |
| Item count | 147 |
| Direct Trait count | 21 |

This scope is an exact **candidate** scope and remains `version_scope_frozen=false` until the preregistration/governance review explicitly freezes it.

A semantic item/scoring/version change after external preregistration requires a documented amendment or a new wave/version. The old registered wave must not be silently rewritten.

## 3. Population and recruitment

### Population definition

Eligible participants are:
- 18 years or older;
- able to understand and affirm the separate calibration consent;
- able to read and answer the `ja-JP` assessment in Japanese;
- completing the exact Wave JA-01 candidate model/version tuple.

### Recruitment model

Recruitment is online volunteer/non-probability recruitment through approved:
- online communities;
- social-media channels;
- participant referral.

The recruitment source must be logged at the wave-operations level, but the psychometric export does not require identity, IP address, precise location, or unrelated product-analytics history.

### Representativeness

Wave JA-01 is not a probability sample.

No general-population prevalence/rarity inference is permitted from this wave merely because the sample is large.

## 4. Sample-size and stopping plan

### Target

- target eligible complete baseline N: **1000**
- minimum N for the planned primary structural bundle: **800**
- recruitment window: **56 days after collection activation**

Recruitment stops at the first of:
1. 1000 eligible complete baseline records; or
2. day 56 after collection activation.

The wave must not stop early because interim psychometric results look favorable, and it must not be extended because results look unfavorable. Any extension requires a preregistration amendment/new-wave decision recorded before the extra records are treated as confirmatory evidence.

### Shortfall behavior

If eligible complete N is below 800 at the planned close:
- Wave JA-01 becomes pilot/descriptive evidence;
- item distributions/reliability/overlap may still be reported with limitations;
- held-out structural confirmation is not claimed;
- the wave cannot by itself support `stable-model` promotion.

### Rationale

The 147-item/21-Trait structure is materially more complex than a small single-scale analysis. The target N is therefore an operationally conservative Wave JA-01 decision intended to support:
- item behavior review;
- per-Trait reliability review;
- all-item structural exploration;
- deterministic holdout analysis;
- uncertainty reporting;
- retest planning.

It is **not** derived from one universal “participants per item” rule.

Methodological background:
- MacCallum RC, Widaman KF, Zhang S, Hong S. *Sample size in factor analysis.* Psychological Methods. 1999;4(1):84–99. DOI: https://doi.org/10.1037/1082-989X.4.1.84
- COSMIN guidance emphasizes analysis-specific structural-validity design and treats sample-size heuristics as context-dependent rather than universal.

## 5. Development / holdout split

Eligible baseline records are assigned deterministically:

1. take `calibrationRecordId`;
2. encode as UTF-8;
3. compute SHA-256;
4. interpret the first 8 hexadecimal digits as an unsigned integer;
5. compute modulo 100;
6. values 0–69 → development sample;
7. values 70–99 → holdout sample.

This yields an expected 70/30 split without using participant identity.

### Holdout access rule

Holdout psychometric outcomes must remain unopened for model-changing decisions until:
- development-sample item/Trait analyses are complete;
- proposed item/Trait changes are frozen in the wave decision ledger.

If total eligible N < 800, or the holdout CFA/model cannot be estimated reliably, the limitation is reported. The development sample must not be relabeled as an independent confirmation sample.

## 6. Primary analytic dataset

Primary exclusions are limited to:

1. withdrawn calibration consent;
2. incomplete assessment;
3. wrong/mixed wave or model-version scope;
4. corrupt/out-of-domain response values;
5. duplicate calibration-record identity caused by processing error.

The assessment itself requires all 147 required responses for completion, so item-level missingness is not expected in the eligible-complete dataset.

## 7. Response-style sensitivity analyses

The following may be computed from answer values:
- all-midpoint response pattern;
- dominant-response pattern;
- extreme-response concentration.

These are **not primary participant exclusion rules**.

Analyses must compare the primary dataset with clearly labeled sensitivity analyses where flagged records are excluded or stratified.

No response-quality pattern may be described as proof of deception, dishonesty, or clinical invalidity.

## 8. Item behavior review

For each item, report at minimum:
- response-category distribution;
- floor/ceiling/extreme concentration;
- skew/shape diagnostics appropriate to ordinal responses;
- corrected item/scale relationship where applicable;
- same-Trait and nearest-overlap behavior;
- development/holdout consistency where estimable.

No single item statistic automatically deletes an item.

Item decisions are recorded as:
- retain;
- review;
- revise in a new item revision;
- retire from a later model.

Published/frozen historical wording is never overwritten.

## 9. Internal consistency

Primary internal-consistency evidence uses McDonald’s omega where appropriate.

Alpha may be reported as supplementary/comparability evidence but must not be the sole reliability conclusion.

Pre-specified review triggers:
- omega < .70 → reliability review;
- omega > .95 → redundancy/item-content review.

These are review triggers, not automatic pass/fail criteria.

Confidence intervals are reported where estimable.

Structural/unidimensionality evidence is reviewed before interpreting internal consistency as evidence that items measure one coherent construct.

## 10. Structural review

### Ordinal treatment

Likert 1–5 responses are treated as ordinal for structural analysis where feasible.

Primary planned methods:
- polychoric/ordinal association matrix;
- parallel-analysis evidence;
- exploratory factor review;
- oblique rotation;
- per-Trait unidimensionality review.

The planned 21-Trait structure is a hypothesis, not a constraint that the analysis must recover.

### Review triggers

- target-factor loading < .30 → item/construct review;
- cross-loading >= .30 → discriminant/item review;
- absolute inter-Trait correlation >= .80 → overlap/merge/narrowing review.

A correlated Trait may remain if theory, item content, discriminant behavior and user-facing value jointly support it.

A Trait may be narrowed, merged or removed even if doing so changes the development 64-code design.

### Held-out structural review

Where achieved holdout N/model behavior support it, report a held-out CFA/structural review.

Report at least:
- CFI;
- TLI;
- RMSEA;
- SRMR;
- convergence/identification problems;
- uncertainty/limitations.

No one fit index can promote the model.

COSMIN criteria may be used as a comparison framework, not as a claim that PCS automatically satisfies clinical/PROM validation standards.

## 11. Test-retest plan

### Timing

- minimum interval: 14 days
- maximum interval: 21 days
- exact same Wave JA-01 model/version required

### Target

- target completed retests: 200
- minimum for planned interpretation: 150

If completed retest N < 150:
- report stability estimates as descriptive/low-precision;
- do not use retest evidence to support stable-model promotion.

### Statistics

Report:
- absolute-agreement ICC with the exact ICC formula documented;
- 95% confidence interval;
- rank-order association;
- systematic mean shift;
- Trait-specific instability.

ICC < .70 is a review trigger, not automatic Trait deletion.

Test-retest point estimates must be interpreted with their confidence intervals and sample characteristics.

Methodological background:
- test-retest ICC reporting literature recommends documenting the ICC model/type and reporting confidence intervals because the point estimate depends on sample size, score variability and measurement error.

### Linkage / context boundary

Current calibration export v0.1 has no retest-linkage field.

Therefore retest collection must not activate until a separately reviewed:
- pseudonymous linkage design;
- export schema;
- consent wording;
- deletion/rotation behavior

exist.

If context-change recording is introduced, it must use a bounded reviewed field, not free text.

## 12. DIF / measurement invariance

Wave JA-01 calibration export v0.1 contains no demographic variables.

Therefore:
- demographic DIF is not a Wave JA-01 inferential objective;
- measurement-invariance claims across demographic groups are not permitted;
- demographics must not be added merely to satisfy a checklist.

A later DIF/invariance study requires:
- a justified subgroup question;
- updated consent;
- updated export schema;
- adequate subgroup sample;
- a new/amended preregistration.

## 13. Item/Trait decision policy

No single:
- omega;
- alpha;
- loading;
- fit index;
- p-value;
- retest coefficient;
- completion rate;
- type frequency

may promote the model by itself.

The evidence bundle includes:
- item distributions;
- internal consistency;
- structural behavior;
- Trait overlap;
- retest;
- item-change ledger;
- limitations;
- version scope.

Marketing preference for a fixed number of types cannot override measurement evidence.

## 14. Multiple testing / exploratory inference

Wave JA-01 is primarily a measurement-development wave.

Item/Trait decisions rely on:
- effect sizes;
- uncertainty;
- replication in holdout where appropriate;
- content/theory review.

Large collections of exploratory p-values must not be treated as independent pass/fail gates. Where inferential tests are used, multiplicity handling and exploratory/confirmatory status must be reported explicitly.

## 15. Data minimization

Wave JA-01 must not export:
- session bearer token/hash;
- public-share token/hash;
- IP address;
- precise location;
- email/name;
- free text;
- unrelated product analytics;
- result prose;
- operational logs;
- demographic fields;
- derived Trait Scores/Core Codes in export v0.1.

The calibration dataset is separate from ordinary product analytics.

## 16. Amendments

After external preregistration, any material change to:
- sample target/stopping;
- inclusion/exclusion;
- holdout assignment;
- retest window;
- analysis methods;
- review triggers;
- version scope

requires a documented amendment before affected new data are treated as confirmatory evidence.

A semantic item/scoring/model change normally creates a new version/wave rather than rewriting history.

## 17. Activation blockers

This draft remains blocked on:
- actual external preregistration record;
- final consent copy/legal/privacy approval;
- production environment separation evidence;
- calibration retention/deletion policy;
- production operator provisioning evidence;
- retest linkage schema/consent if retest is activated;
- explicit version-scope freeze.

Until those are resolved:
- `preregistered=false`;
- `version_scope_frozen=false`;
- `collection_enabled=false`;
- `export_enabled=false`;
- `collection_start_allowed=false`.

## 18. Planned outputs

Before a stable-model review, produce:
- dataset definition/exclusion report;
- exact version-scope manifest;
- item behavior report;
- reliability report;
- retest report;
- factor/structural report;
- overlap/discriminant report;
- item-change ledger;
- limitations report.

## 19. Registration record

External preregistration reference:

**Not yet assigned.**

Repository field remains `preregistration_document_ref=null` until an inspectable external registration record actually exists.
