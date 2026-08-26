# 02 — Diagnostic Model Requirements

## Purpose

Defines the measured trait system independently from UI and prose. Presentation domains are not assumed to be independent psychological factors.

## Trait admission criteria

A retained trait MUST:

1. Have a precise definition and opposite/low-score interpretation.
2. Be distinguishable from neighboring traits in theory and item wording.
3. Support multiple behavioral indicators.
4. Explain useful variation in results.
5. Avoid near-total redundancy with another retained trait.
6. Be stable enough for intended use after retest analysis.

## Trait Dictionary v0.2 requirements

For every candidate/retained trait document:

- stable trait ID;
- working and public-facing name;
- construct definition;
- what it is NOT;
- high-score behavioral tendency;
- low-score behavioral tendency;
- extreme-high failure mode;
- extreme-low failure mode;
- score anchors at approximately 10/30/50/70/90;
- candidate observable behaviors;
- expected correlates;
- nearest overlapping traits and distinction rule;
- applicable result domains;
- item-writing cautions.

## Current candidate set

The working candidates in `docs/DIAGNOSTIC_MODEL.md` remain hypotheses until Trait Dictionary v0.2 is frozen. No candidate is guaranteed retention merely because code already references it.

## Overlap matrix

- **PCS-DIAG-010** MUST compare every retained trait pair conceptually before item-bank freeze.
- **PCS-DIAG-011** Highly overlapping traits MUST be merged, narrowed, or explicitly justified.
- **PCS-DIAG-012** Statistical correlation alone MUST NOT automatically merge constructs; theory and item content must also be reviewed.

## Interaction model

Interactions are allowed only when they add meaning beyond separate trait summaries.

Each interaction rule MUST define:

- input trait IDs;
- threshold/range condition;
- interpretation claim;
- conflicting generic modules it overrides/suppresses;
- evidence status (`hypothesis`, `beta-supported`, `validated` if later justified);
- model/content version.

Interaction explosion is prohibited. A pair/combination is included only when its interpretation is materially useful and testable.

## Presentation domains

Required v1 presentation views may include:

- Thinking
- Emotion
- Action
- Relationships / Love
- Work
- Stress
- Communication
- Decision Making
- Learning
- Leadership
- Risk
- Creativity
- Hidden Strengths
- Adversarial Analysis
- Growth

A domain can use multiple trait scores/interactions. The UI MUST NOT imply these domains are independent latent factors unless evidence supports that claim.

## Psychometric status labels

Allowed internal/public evidence stages:

1. `experimental`
2. `beta-calibrating`
3. `stable-model`
4. `validated` only after explicitly documented evidence criteria are satisfied.

Before validation, copy should say “PCS measures/estimates this tendency under model X” rather than asserting objective personality truth.

## Minimum evidence work before model v1.0 freeze

- item-total behavior review;
- internal consistency (prefer McDonald's omega; alpha may be supplementary);
- test-retest stability;
- exploratory factor review;
- confirmatory analysis when sample size supports it;
- redundancy/inter-trait correlation review;
- response-distribution/floor/ceiling review;
- demographic/language measurement-invariance or DIF analysis when sample size permits;
- documented item removals and rationale.

## Population rarity rule

Type rarity is NOT a model property. It is a dataset statistic.

Any displayed percentage MUST specify or link to:

- assessment model version;
- valid sample size;
- time window;
- language/region scope where relevant;
- exclusion rules.

Website-user percentages MUST NOT be described as the percentage of all humans.
