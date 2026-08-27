# Psychometric Validation Gates v0.1

> Status: authoritative evidence policy for PCS model claims
> Date: 2026-08-26

## 0. Purpose

PCS must separate **product completeness** from **measurement evidence**. A polished website or internally consistent score does not make a construct scientifically validated.

No stage label upgrades automatically from a single statistic. Evidence is reviewed as a bundle and exceptions require documented rationale.

## 1. Evidence stages

### Stage A — `experimental`

Allowed when:

- construct has a written definition/boundary;
- candidate items are versioned;
- deterministic scoring exists;
- no public claim of validation is made.

Public wording examples:

- "PCS estimates your tendency under model vX."
- "Experimental trait model."

Forbidden wording:

- "scientifically proven personality"
- "objective truth about you"
- medical/clinical interpretation

### Stage B — `beta-calibrating`

Requires documented beta sample and all of:

- item distributions reviewed for floor/ceiling/pathological skew;
- item-total/scale behavior reviewed;
- internal-consistency evidence reviewed (McDonald's omega preferred; alpha may be supplementary);
- redundancy/inter-trait correlations reviewed;
- at least one planned retest cohort or retest study underway;
- item removals/changes logged with rationale.

No single omega/alpha cutoff alone upgrades the construct.

### Stage C — `stable-model`

Requires all of:

- scoring/item set frozen for a named model version;
- adequate internal consistency for intended interpretation, with confidence intervals where practical;
- test-retest stability measured over a defensible interval and population;
- exploratory factor review completed;
- confirmatory/held-out structural review where sample size permits;
- discriminant review against nearest-overlap PCS traits;
- known limitations documented;
- language/version scope explicitly stated;
- result reproducibility/golden fixtures pass.

The term "stable" means the product model is version-frozen and supported enough for consistent use; it does **not** mean globally validated.

### Stage D — `validated`

This label is intentionally difficult to obtain. It requires a documented validation report covering, at minimum:

- reliability evidence appropriate to intended use;
- test-retest evidence;
- structural/factor evidence on data not used solely to invent the model;
- convergent validity against relevant established measures or external criteria where appropriate;
- discriminant validity against neighboring constructs;
- criterion/predictive evidence for any behavioral claim presented as such;
- measurement-invariance/DIF review across major supported language/demographic groups when sample size permits;
- transparent limitations and failure cases;
- independent or held-out replication evidence;
- expert psychometric review of the claim scope.

A trait can be `stable-model` indefinitely without being called `validated`.

## 2. Quantitative targets are review triggers, not magic numbers

PCS may set operational targets in analysis plans (for example internal consistency or retest coefficients), but:

- thresholds must be chosen before inspecting the final confirmation dataset when possible;
- confidence intervals and sample characteristics matter;
- extremely high internal consistency may indicate redundant items rather than quality;
- a good fit index does not prove construct validity;
- statistical significance alone is not a meaningful quality gate;
- sample size adequacy must be justified relative to the analysis/model complexity rather than by one universal N.

## 3. Retest policy

Retest analysis must document:

- interval length;
- whether major life/context changes were screened or recorded;
- exact model/item version;
- attrition/exclusion rules;
- score stability and systematic mean shift;
- trait-specific instability.

A result can be reproducible computationally while the measured construct itself has poor retest stability; these are separate concepts.

## 4. Factor/redundancy policy

Before v1.0:

- review empirical factor structure rather than forcing the planned trait count;
- traits with strong empirical overlap trigger item-content review;
- merge only when theory + item content + empirical evidence jointly support merging;
- retain correlated traits only when they have clear discriminant behavior and user-facing explanatory value;
- do not preserve dimensions solely because code/type marketing depends on them.

## 5. Language and cultural scope

A Japanese model result must not be assumed equivalent in another language after translation alone.

Each supported language requires:

- controlled translation/review;
- item meaning review;
- distribution/reliability check;
- DIF/invariance analysis when data volume allows;
- language scope attached to rarity/distribution claims.

## 6. Population rarity policy

Rarity is never part of validation and never inferred from theoretical combinations.

Any type/trait distribution displayed publicly must include or link to:

- assessment model version;
- valid sample count;
- collection time window;
- language/region scope;
- invalid-session exclusion rules;
- clear statement that website respondents are not a random sample of humanity.

Until adequate real data exist, display `集計データ不足` / `insufficient sample` rather than a fabricated percentage.

## 7. Prohibited inference classes

PCS is not allowed to infer or claim from ordinary personality scores:

- psychiatric/medical diagnosis;
- criminality;
- truthfulness/deception status;
- intelligence/IQ;
- employability or hiring suitability as an objective fact;
- relationship destiny;
- guaranteed future behavior.

## 8. Closed-beta protocol foundation

Before Stage B collection begins, PCS uses `BETA_CALIBRATION_PROTOCOL_v0.1.md` and `data/calibration/beta-protocol-v0.1-dev.json` to freeze activation prerequisites, version scope, planned analysis classes, retest/sample-planning requirements and versioned model-change rules.

The machine-readable protocol intentionally keeps collection/export/public-validation claims disabled until consent, legal/privacy, environment separation and pre-registered analysis prerequisites exist.

## 9. Validation artifact requirements

Every evidence-stage promotion requires a versioned report containing:

- dataset definition and exclusions;
- exact item/scoring/model version;
- analysis code or reproducible notebook where feasible;
- reliability/stability/structure results;
- overlap/discriminant findings;
- removed/reworded items and reason;
- limitations;
- approval record/date.

The production model registry must reference the evidence-stage and report version used at publication.