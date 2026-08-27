# Assessment Model Release Contract v0.1

> Status: development release/freeze foundation
> Current manifest: `assessment-dev-v0.3`
> Production activation: **blocked**

## Purpose

Make model activation an explicit versioned release decision rather than an incidental UI deployment or environment-variable edit.

The current development model can be used for development/beta flows, but its manifest deliberately cannot pass a production-public activation gate because C01D remains `public_use=false` and Phase 5 evidence is incomplete.

## Release manifest

Every model selected for an assessment environment must eventually have a manifest that records:

- model version/status/locale;
- Trait Dictionary version;
- Item Bank version;
- scoring version;
- code schema version;
- interaction version;
- content version;
- item count;
- deterministic/Golden evidence requirements;
- migration/content compatibility review;
- rollback strategy;
- production/public activation decision and blockers.

## Freeze semantics

A production freeze means the version tuple and item mappings are immutable. Any change to item wording/revision, scoring keys/weights, Core schema meaning, interaction logic or result content identity creates a new applicable version instead of mutating the frozen release.

The database immutability triggers remain the persistence enforcement layer; this manifest is the release-decision layer.

## Current development manifest

`data/release/assessment-dev-v0.3.json` records the exact currently seeded development model:

- 147 reviewed items;
- Trait Dictionary v0.2;
- Item Bank v0.2;
- scoring v0.1-dev;
- C01D/core-code-v0.1-dev;
- trait-interactions-v0.1;
- content-dev-v0.3;
- status beta;
- production/public activation false.

The explicit blockers prevent editorial/engineering completeness from being mistaken for a production psychometric freeze.

## Production activation gate

A future manifest may set production/public activation true only when all applicable authoritative gates are satisfied, including:

- public code schema decision;
- required psychometric evidence stage/reports;
- production model/item freeze;
- content/catalog compatibility;
- curated illustration/fallback contract where required;
- migration review;
- rollback plan;
- green release CI;
- production environment/security/legal launch gates.

## Automated evidence

`scripts/validate-release-operations.mjs` verifies the repository release policy, rollback-domain coverage, current development model version tuple, C01D non-public blocker, no production activation, and the presence of mandatory rollback/runbook sections.

The separate `production-model-activation-gate-v0.1-dev` cross-checks the candidate manifest against the public catalog gate, manual accessibility gate, observability gate and public launch gate, and requires every production evidence field to remain pending while those sources are not ready.

This advances PCS-SCORE-003/PCS-OPS-005 but does not close them because no production public model has yet passed the activation gate.
