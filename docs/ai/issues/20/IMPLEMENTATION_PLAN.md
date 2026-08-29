# Issue #20 — Implementation Plan

## Issue

research: Beta Wave JA-01 preregistration candidateを具体化

## Base

- Repository: `Hibiki49aaiii/Personality-Code-System`
- Base SHA: `2fbc71d8f9195bfa81b0dd1c42541cf7234df100`
- Branch: `issue-20-beta-wave-preregistration-candidate`

## Goal

Convert Beta Wave JA-01 from a deliberately empty preregistration template into a concrete, registration-ready research plan while preserving all pre-collection safety boundaries.

This Issue MUST NOT:
- claim external preregistration;
- freeze the wave as externally registered;
- enable calibration collection or export;
- add a runtime calibration endpoint/job;
- add demographic/identity/free-text fields;
- promote C01D or the assessment model.

## Current Architecture

### Research/governance layer
- `data/calibration/beta-protocol-v0.1-dev.json`
- `data/calibration/beta-wave-ja-01-draft.json`
- `data/calibration/consent-purpose-v0.1-dev.json`
- `docs/model/BETA_CALIBRATION_PROTOCOL_v0.1.md`
- `docs/model/CALIBRATION_EXPORT_SPEC_v0.1.md`

### Machine gates
- `scripts/validate-calibration-protocol.mjs`
- `scripts/validate-beta-wave-draft.mjs`
- `scripts/validate-calibration-export-schema.mjs`

### Runtime boundary
- consent receipt storage exists but the normal runtime role has zero access;
- no `src/app/api/calibration` route;
- no calibration export runtime job;
- no answer-level research dataset exists.

## Target State

Wave JA-01 becomes:

`registration-ready-not-preregistered`

Meaning:
- exact candidate scope is known;
- population/recruitment/sample/exclusion/retest/holdout/analysis decisions are written;
- critical decisions are machine-validated;
- external preregistration reference remains null;
- version scope is still not represented as externally/finally frozen;
- collection/export/start remain false.

## Data Flow

No new runtime data flow.

The only flow created by this Issue is documentation/configuration:

`release manifest -> wave prereg candidate -> validator -> CI`

No participant data are created or moved.

## Research Decisions

### Baseline sample
- target eligible completes: 1000
- primary structural-bundle minimum: 800
- collection stopping rule: 8 weeks from activation or 1000 eligible completes, whichever occurs first
- N < 800: pilot/descriptive outcome; no held-out structural confirmation/stable-model promotion

This is an operational preregistration target, not a universal psychometric rule.

### Development / holdout
- 70/30 deterministic split
- based on SHA-256 of random calibration record ID
- holdout unopened for model-changing decisions until development decisions are frozen

### Inclusion
- adult 18+
- capable of affirmative consent
- able to read/respond in Japanese to the ja-JP instrument
- compatible exact wave/model scope

### Primary exclusion
- withdrawn consent
- incomplete assessment
- mixed/wrong version
- corrupt/impossible response
- processing-duplicate calibration record

Response-style flags do not automatically remove participants; they define sensitivity analyses.

### Retest
- 14–21 days
- exact same model/wave
- target 200 completed retests
- <150 completed: descriptive/low-precision only; no stable-model promotion based on retest
- implementation requires a future separately reviewed linkage schema

### Structural / reliability review
- ordinal/polychoric analysis
- parallel analysis + oblique exploratory factor review
- per-Trait unidimensionality review
- held-out CFA only when supported
- review triggers:
  - loading < .30
  - cross-loading >= .30
  - omega < .70
  - omega > .95 redundancy review
  - inter-Trait |r| >= .80 overlap review
- fit indices reported together with uncertainty/limitations; no single metric promotes stage

### Retest statistics
- absolute-agreement ICC with explicit formula + 95% CI
- rank-order association
- systematic mean shift
- ICC < .70 or wide/low CI triggers review; not automatic deletion

### DIF / invariance
Not a Wave 01 inferential objective because export v0.1 contains no demographic variables. A later schema/consent protocol is required.

## Files

### Modify
- `data/calibration/beta-wave-ja-01-draft.json`
- `data/calibration/beta-protocol-v0.1-dev.json`
- `scripts/validate-beta-wave-draft.mjs`
- `scripts/validate-calibration-protocol.mjs`
- `docs/model/BETA_CALIBRATION_PROTOCOL_v0.1.md`

### Add
- `docs/model/BETA_WAVE_JA_01_PREREGISTRATION_DRAFT.md`
- this plan

## Error / Failure Behavior

CI must fail if:
- registration-ready plan loses required concrete fields;
- target/minimum/stop policy drifts;
- preregistered becomes true without a real registration record;
- collection/export/start become true;
- version tuple drifts from `assessment-dev-v0.3`;
- DIF/invariance is claimed while demographics remain excluded;
- holdout/retest/exclusion rules disappear;
- response-style flags become hidden automatic exclusions.

## Security / Privacy

No runtime or DB permission changes.
No new personal-data fields.
No demographic export.
No free text.
No identity/IP/location.
No ordinary analytics reuse.

## Test Plan

1. `npm run validate:calibration`
2. normal CI validators
3. typecheck
4. production build
5. domain/infrastructure suites
6. Chromium E2E
7. CodeQL

## Rollback

Revert the documentation/config/validator commit set. Since no runtime collection/export or DB schema changes occur, rollback has no participant-data consequences.

## Human Understanding

### What
A concrete preregistration candidate for the first Japanese closed-beta wave.

### Why
The current empty template cannot be externally registered or used to defend against post-hoc research decisions.

### How
Freeze the candidate decisions in JSON + a human-readable protocol and make CI enforce them, while keeping every activation flag false.

### Important decisions
- target N=1000 / structural minimum=800;
- deterministic 70/30 holdout;
- 14–21 day retest;
- no demographic/DIF claim in Wave 01;
- thresholds are review triggers, not validation magic numbers.

### Invariants
- no collection/export;
- no false preregistration;
- exact model/version tuple;
- ordinary analytics remain separate;
- no single statistic promotes model stage.

### Failure modes
- recruitment shortfall;
- insufficient holdout/retest N;
- unsupported 21-Trait structure;
- external/legal preregistration requests amendments.

### Change impact
Research/governance only. No shipped diagnostic behavior changes.
