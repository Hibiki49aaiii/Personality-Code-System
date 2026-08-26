# 04 — Personality Code and Result Engine Requirements

## Purpose

Defines how deterministic trait measurements become a memorable personality identity and detailed result without free-form AI interpretation.

## Core Code

The Core Code MUST be derived from explicitly specified measured dimensions or deterministic cluster/classification rules.

Requirements:

- **PCS-RESULT-001** Every character/segment in a public code has a documented semantic meaning.
- **PCS-RESULT-002** Code boundaries/thresholds are part of the assessment model or code-schema version.
- **PCS-RESULT-003** The number of Core Types is a consequence of a coherent code system, not an arbitrary marketing target.
- **PCS-RESULT-004** Near-boundary scores MUST be handled by a documented deterministic rule; no random tie breaking.
- **PCS-RESULT-005** A Core Type name is presentation metadata and MUST NOT silently change the underlying code semantics.

## Extended Code

Extended Code exists to preserve individual differences hidden by the Core Type.

The schema MUST define:

- syntax and ordering;
- included secondary traits/modifiers;
- threshold/range notation;
- model/code schema version;
- treatment of unavailable/low-confidence components;
- backward compatibility rules.

Extended Code MUST remain parseable by application code; it must not be an unstructured prose label.

## Result input contract

Result composition consumes only versioned structured diagnostic output, for example:

- assessment model version;
- code schema version;
- normalized trait scores;
- interaction flags;
- confidence metadata;
- Core Type;
- Extended Code;
- locale;
- content version.

Raw free-text user interpretation is not a required input.

## Deterministic content modules

Every result paragraph/block MUST originate from a versioned content module or deterministic template.

Each module SHOULD have:

- module ID;
- locale;
- applicable domain;
- activation rule;
- priority;
- claim/assertion tags;
- exclusion/conflict tags;
- evidence/status metadata where relevant;
- content version.

## Contradiction prevention

The composer MUST apply explicit precedence:

1. Specific validated/approved interaction modules.
2. Core Type synthesis modules.
3. Trait-range modules.
4. Neutral/fallback modules.

A higher-priority module may suppress lower-priority modules that make a materially conflicting claim.

Example failure to prevent:

- generic `high autonomy` module says “you dislike relying on others”;
- an approved interaction indicates high autonomy + high delegation = independent but comfortable assigning ownership;
- result must not display both as if equally true.

The system SHOULD use assertion/exclusion tags so contradictions are testable rather than left to editorial intuition.

## Required result domains

The v1 result schema MUST support:

- core identity;
- trait overview;
- thinking;
- emotion;
- action;
- relationships/love;
- work;
- stress;
- communication;
- decision making;
- learning;
- leadership;
- risk;
- creativity;
- hidden strengths;
- adversarial/failure-mode analysis;
- growth guidance;
- personal manual summary.

Not every domain needs equal length, but absence must be intentional and schema-valid.

## Adversarial analysis rules

Adversarial analysis MUST:

- describe how strengths can become liabilities at extremes;
- distinguish tendency from certainty;
- avoid insults, diagnoses, moral judgment, or deterministic predictions;
- use the same measured data as the normal profile;
- never invent an unrelated weakness solely for entertainment.

## Result snapshots

A finalized result snapshot MUST record enough version metadata to reproduce the displayed result:

- assessment model version;
- item-set/scoring version as applicable;
- code schema version;
- content version;
- illustration asset version/reference;
- computed structured scores/codes;
- generated deterministic module selection/order.

Historical snapshots MUST NOT silently change when current editorial content changes.

## Result reproducibility tests

For fixed fixture input:

- code equality MUST be byte-for-byte stable within the same version;
- selected module IDs/order MUST be stable;
- serialized result schema MUST be stable or explicitly migrated;
- old-version snapshots MUST remain readable after new model releases.
