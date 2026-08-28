# ILLUSTRATION_ASSET_INGEST_v0.1-dev

> Status: Phase 3B production-ingest foundation
> Public use: **false**
> Runtime generation: **false**

## Purpose

The existing 64 production briefs define what should be drawn, but they did not provide an executable transition from “brief ready” to a real versioned asset.

This layer introduces that transition without pretending any artwork currently exists.

Files:

- `data/illustration/v0.1-dev/asset-ingest-contract.json`
- `data/illustration/v0.1-dev/asset-production-registry.json`
- `scripts/validate-illustration-asset-registry.mjs`

## Current state

All 64 C01D slots remain `unproduced`.

That is intentional. The registry exists now so adding real artwork later cannot bypass provenance, byte identity, dimensions, crop lineage or human review.

## Produced master requirements

A non-`unproduced` asset must record:

- exact versioned `asset_id`;
- committed master path under `artwork/illustration/masters/`;
- media type;
- SHA-256 of the committed bytes;
- raster dimensions where applicable;
- production method;
- creator/source;
- license or usage basis;
- explicit `human_curated=true`.

Allowed production methods are:

- hand-authored;
- commissioned;
- licensed-source;
- generative-development-curated.

The last option describes a development production tool only. It does not permit generation at runtime and never bypasses human curation/license review.

## Approved asset requirements

An `approved` entry additionally requires:

- all nine brief review checks = true;
- reviewer identity;
- review timestamp;
- all three committed web variants;
- exact deterministic variant dimensions:
  - result portrait: 960×1200;
  - OG landscape: 1200×630;
  - share portrait: 1080×1350;
- SHA-256 for each variant;
- each variant links back to the exact source master asset ID.

If a referenced file exists with different bytes than the recorded digest, CI fails.

## Public-release boundary

An asset can be reviewed as a development asset without making C01D public.

Current registry entries therefore remain `public_use=false`. A future public release still requires:

1. owner-approved art direction;
2. Phase 5C public schema/model decision;
3. public catalog promotion;
4. approved asset mapping for every reachable published type.

This layer advances PCS-ART-002 operationally but does not complete it.
