# Public Launch Gate v0.1

> Status: **BLOCKED**
> Machine-readable source: `data/release/public-launch-gate-v0.1-dev.json`
> Date: 2026-08-27

## Purpose

Turn the Phase 6 / PCS-OPS-006 launch checklist into a fail-closed release artifact. The repository must make it difficult to announce v1.0 merely because the application builds.

## Current rule

`public_launch_ready` stays false until both categories are satisfied:

1. every required Master requirement / phase gate is complete;
2. deployment/manual evidence that cannot be proven by repository CI is recorded as complete.

## Required Master gates

The manifest currently requires completion of production model freeze, result version completeness, public editorial/type catalog, curated artwork, accessibility, performance, legal, share-card artwork, calibration path, security/privacy QA, environment separation, secrets, monitoring and release activation requirements.

## Required phase gates

- Phase 3A public Core Type/content catalog
- Phase 3B illustrations
- Phase 4A social sharing/OG
- Phase 4B analytics/monitoring
- Phase 5A closed beta/calibration collection
- Phase 5B statistical review/pruning/retest
- Phase 5C production assessment/public code model freeze

## External/manual evidence

The launch gate explicitly tracks evidence that repository CI cannot invent:

- distinct production environment;
- TLS/domain;
- secret store/rotation;
- DB least privilege;
- trusted proxy configuration;
- backup/restore rehearsal;
- independently durable monitoring;
- manual accessibility walkthrough;
- external security review;
- legal/publication review;
- representative Core Web Vitals evidence.

## Launch actions blocked while false

- v1.0 announcement;
- public indexing as a production-ready service;
- validated/scientifically-proven wording;
- population rarity publication.

## Validator

`scripts/validate-public-launch-gate.mjs` parses `REQUIREMENTS.md`, proves that the declared blockers are actually still open, proves external/manual evidence is still pending, and requires PCS-OPS-006 to remain unchecked.

When all blockers are eventually resolved, the correct change is **not** to bypass this validator. Create a reviewed launch-gate version/update that records exact evidence and then flip the gate intentionally.
