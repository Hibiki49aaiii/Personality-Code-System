# PRODUCTION_MODEL_ACTIVATION_GATE_v0.1-dev

> Status: **BLOCKED**
> Candidate: `assessment-dev-v0.3`
> Machine source: `data/release/production-model-activation-gate-v0.1-dev.json`

## Purpose

Separate “the repository can technically run a deterministic model” from “this exact model may become the production public model”.

This gate is the explicit activation/freeze decision layer for PCS-SCORE-003 and PCS-OPS-005. It prevents an ordinary application deploy or environment-variable change from silently turning the current beta model into a public production model.

## Repository evidence already complete

The candidate already has:

- exact version tuple and item count;
- versioned item/model mappings;
- deterministic domain and Golden Snapshot tests;
- ordered SQL migration framework and static migration review gate;
- rollback runbook;
- PostgreSQL published-row immutability;
- immutable result/illustration asset lineage.

These are release mechanics. They do not establish psychometric validity or public readiness.

## Production evidence still required

Activation remains blocked on:

- public Core Code schema decision;
- Phase 5 beta/calibration evidence;
- production environment separation;
- production migration rehearsal;
- approved public editorial catalog;
- approved public illustration mapping;
- real manual accessibility review;
- representative field performance/release review;
- final legal/privacy review;
- operational production monitoring;
- production security/privacy release review.

## Freeze behavior

When a future model is activated:

1. the activation record references one exact immutable version tuple;
2. migration review is attached explicitly;
3. rollback/fallback target is explicit;
4. green release CI evidence is recorded;
5. active-model selection changes without rewriting historical published rows;
6. results already completed remain attached to their original model/content/asset versions.

## Current action state

All production/public activation actions are false. C01D remains `public_use=false`; nothing in this gate authorizes “validated”, population-rarity or finalized public-taxonomy claims.
