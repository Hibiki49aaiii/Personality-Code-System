# Diagnostic Model — Working Draft v0.2

> Status: experimental conceptual model; not scientifically validated
> Date: 2026-08-26

This document is the short model overview. Authoritative details live in the model artifacts below.

## Authoritative model artifacts

- [`model/TRAIT_DICTIONARY_v0.2.md`](model/TRAIT_DICTIONARY_v0.2.md) — retained constructs, definitions, boundaries, behavioral anchors.
- [`model/TRAIT_OVERLAP_MATRIX_v0.2.md`](model/TRAIT_OVERLAP_MATRIX_v0.2.md) — complete conceptual pairwise overlap review.
- [`model/TRAIT_INTERACTIONS_v0.1.md`](model/TRAIT_INTERACTIONS_v0.1.md) — deterministic interaction hypotheses and contradiction-suppression rules.
- [`model/VALIDATION_GATES_v0.1.md`](model/VALIDATION_GATES_v0.1.md) — evidence stages required before validation claims.

## v0.2 direct-measurement candidate set

21 constructs are retained for candidate item authoring:

`SYS VER ADV ABS META EMO COG BND RDP REC CON AUT EXE OPT FIN NOV PER RSK UNC STR CRE`

They are hypotheses until empirical calibration supports them.

## Removed from direct measurement

The following v0.1 candidates are no longer direct numeric traits:

- `LDR` Leadership Structure — derived/presentation profile because it mixes multiple base tendencies and role context.
- `DEL` Delegation — derived work-behavior hypothesis because role authority/team/task context materially determine behavior.
- `TRN` Cross-domain Transfer — derived hidden-strength profile because of overlap with ABS/CRE/SYS and likely performance/knowledge dependence.

Removing a direct trait is not loss of result detail: these patterns can still be explained through versioned interactions without double-scoring the same underlying tendencies.

## Model architecture

### Layer A — measured Trait Vector

Continuous scores from versioned assessment items. Only retained direct traits receive standalone numeric scores.

### Layer B — interactions and derived profiles

Versioned deterministic rules interpret combinations when they add meaning beyond isolated scores. Derived profiles do not automatically receive numeric scores.

### Layer C — Core Type / Extended Code

The human-readable identity system is built later from interpretable measured structure. The number of Core Types must not be chosen first and then forced onto the data.

### Layer D — presentation domains

Thinking, Emotion, Action, Relationships/Love, Work, Stress, Communication, Decision Making, Learning, Leadership, Risk, Creativity, Hidden Strengths, Adversarial Analysis, Growth.

Domains are narrative views that compose multiple measured traits and interactions. They are not assumed to be independent psychological factors.

## Key anti-contradiction examples

- High `OPT` does not imply weak finishing when `FIN` is also high.
- High `RDP` does not imply dependency when `BND` is high.
- High `COG` does not imply emotional distance when `EMO` is high.
- High `UNC` does not imply risk-seeking when `RSK` is low.
- High `VER` does not imply suspiciousness when `ADV` is low.

The result engine must apply interaction precedence instead of simply concatenating every high/low trait paragraph.

## Item-bank next step

For every retained trait:

1. author 6–8 candidate items;
2. include discriminant items for high-overlap neighbors;
3. review desirability, ambiguity, double-barreling, context dependence, and transparent scoring;
4. assign exactly one primary scoring trait per item;
5. version the candidate bank before implementation.

## Population percentage

No theoretical rarity percentage is allowed. Before real data exist, rarity is unavailable. After data collection, any displayed distribution is scoped to valid PCS assessment samples and must state model/sample/time/language scope.

## Scientific-claim rule

PCS can be a useful deterministic personality model before it is scientifically validated, but it must label that state accurately. See `model/VALIDATION_GATES_v0.1.md`.