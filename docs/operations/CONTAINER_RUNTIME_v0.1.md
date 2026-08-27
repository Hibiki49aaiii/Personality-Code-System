# CONTAINER_RUNTIME_v0.1

> Status: repository build/runtime foundation
> Production deployment evidence: **not yet proven**
> Contract: `data/operations/container-runtime-v0.1-dev.json`

## Purpose

Provide one reproducible application artifact that can be promoted through preview and production without rebuilding diagnostic logic differently per environment.

PCS now uses Next.js `output: "standalone"` and a multi-stage Node 22 Alpine image.

## Runtime properties

- dependency and application build stages are separated from the final runtime image;
- final process runs as non-root user `nextjs` (UID 1001);
- only the standalone server, Next static assets and public assets are copied into the runtime stage;
- production secrets are injected at runtime and MUST NOT be baked into the image;
- no AI/LLM credential is part of the runtime contract;
- `/api/health` is the readiness target;
- production browser source maps remain prohibited by the existing build contract.

## Required production environment

The deployment platform must inject server-side:

- `DATABASE_URL`;
- `PCS_RATE_LIMIT_SECRET`;
- `PCS_SITE_ORIGIN`;
- `PCS_ASSESSMENT_MODEL_VERSION`.

The exact values remain outside Git.

## Verification

`npm run smoke:standalone` prepares the standalone directory exactly as the image layout expects, starts `server.js`, verifies database readiness, loads the reviewed landing page and fetches one referenced `/_next/static/` asset.

`npm run validate:runtime-package` statically verifies the non-root/standalone/no-baked-AI-secret packaging contract.

This improves PCS-OPS-001/002/006 readiness but does **not** prove distinct preview/production deployments, registry digest provenance, TLS, runtime secret injection or production smoke evidence. Those remain external release gates.
