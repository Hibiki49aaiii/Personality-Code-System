# 02 — Diagnostic Model Requirements

## Purpose

Defines the measured trait system independently from UI and prose. Presentation domains are not assumed to be independent psychological factors.

## Authoritative model artifacts

- [`../model/TRAIT_DICTIONARY_v0.2.md`](../model/TRAIT_DICTIONARY_v0.2.md)
- [`../model/TRAIT_OVERLAP_MATRIX_v0.2.md`](../model/TRAIT_OVERLAP_MATRIX_v0.2.md)
- [`../model/TRAIT_INTERACTIONS_v0.1.md`](../model/TRAIT_INTERACTIONS_v0.1.md)
- [`../model/VALIDATION_GATES_v0.1.md`](../model/VALIDATION_GATES_v0.1.md)

## Trait admission criteria

A retained trait MUST:

1. Have a precise definition and opposite/low-score interpretation.
2. Be distinguishable from neighboring traits in theory and item wording.
3. Support multiple behavioral indicators.
4. Explain useful variation in results.
5. Avoid near-total redundancy with another retained trait.
6. Be stable enough for intended use after retest analysis.

The number of traits is not a product KPI. No trait may be retained solely to make PCS appear more granular.

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
- nearest overlapping traits and distinction rule;
- applicable result domains;
- item-writing cautions.

**Current status:** satisfied conceptually by `TRAIT_DICTIONARY_v0.2.md`. This is a freeze for item authoring, not empirical validation.

## Retained v0.2 direct traits

`SYS VER ADV ABS META EMO COG BND RDP REC CON AUT EXE OPT FIN NOV PER RSK UNC STR CRE`

## Removed from direct trait scoring

- `LDR` Leadership Structure → derived profile
- `DEL` Delegation → derived work-behavior hypothesis
- `TRN` Cross-domain Transfer → derived hidden-strength profile

These removals prevent context-dependent or overlapping concepts from receiving independent numeric weight without evidence.

## Overlap matrix

- **PCS-DIAG-010** MUST compare every retained trait pair conceptually before item-bank freeze. **Satisfied v0.2.**
- **PCS-DIAG-011** Highly overlapping traits MUST be merged, narrowed, or explicitly justified. **Satisfied conceptually v0.2; empirical review remains mandatory.**
- **PCS-DIAG-012** Statistical correlation alone MUST NOT automatically merge constructs; theory and item content must also be reviewed.

High-risk conceptual pairs currently requiring discriminant items:

- VER × ADV
- EMO × COG
- OPT × FIN
- RSK × UNC

## Interaction model

Interactions are allowed only when they add meaning beyond separate trait summaries.

Each interaction rule MUST define:

- stable interaction ID;
- input trait IDs;
- threshold/range condition;
- interpretation claim;
- conflicting generic modules it overrides/suppresses;
- applicable domains;
- evidence status (`hypothesis`, `beta-supported`, or later evidence label);
- model/content version.

Interaction explosion is prohibited. A pair/combination is included only when its interpretation is materially useful and testable.

**Current status:** initial deterministic hypothesis register is defined in `TRAIT_INTERACTIONS_v0.1.md`. All current rules remain hypotheses.

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
- Leadership (derived)
- Risk
- Creativity
- Hidden Strengths
- Adversarial Analysis
- Growth

A domain can use multiple trait scores/interactions. The UI MUST NOT imply these domains are independent latent factors unless evidence supports that claim.

## Psychometric status labels

Allowed evidence stages:

1. `experimental`
2. `beta-calibrating`
3. `stable-model`
4. `validated` only after the explicitly documented evidence gate is satisfied.

Before validation, copy should say “PCS measures/estimates this tendency under model X” rather than asserting objective personality truth.

Detailed promotion requirements are authoritative in `VALIDATION_GATES_v0.1.md`.

## Minimum evidence work before model v1.0 freeze

- item distribution/floor/ceiling review;
- item-total behavior review;
- internal consistency (prefer McDonald's omega; alpha supplementary if used);
- test-retest stability;
- exploratory factor review;
- confirmatory/held-out structure analysis when sample size supports it;
- redundancy/inter-trait correlation review;
- discriminant review of high-overlap trait pairs;
- demographic/language measurement-invariance or DIF analysis when sample size permits;
- documented item removals and rationale;
- reproducible analysis artifact/report.

## Population rarity rule

Type rarity is NOT a model property. It is a dataset statistic.

Any displayed percentage MUST specify or link to:

- assessment model version;
- valid sample size;
- time window;
- language/region scope where relevant;
- exclusion rules.

Website-user percentages MUST NOT be described as the percentage of all humans.

## Next development gate

Proceed to candidate item-bank authoring against the 21 retained v0.2 traits. No scoring-engine implementation should freeze before the candidate bank and scoring specification are versioned.