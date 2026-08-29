# RELEASE_EVIDENCE_PACK_v0.1

> Status: CI source/model/schema/migration identity pack
> This is not production deployment evidence.

## Purpose

A green CI run should leave an inspectable record of **what** it verified, not only a green badge.

The final normal-CI step now produces `release-candidate-evidence.json` only after the full browser E2E passes.

## Frozen identity

The pack records:

- full source commit SHA;
- Master Requirements version;
- exact assessment model version tuple;
- Wave JA-01 repository scope-freeze manifest identity, including its ordered canonical-file SHA-256 aggregate;
- code-schema public-use state;
- public-launch / production-activation state;
- canonical pending production evidence IDs and pending/complete counts;
- exact incomplete Master Requirement IDs and delivery phase gates from the current launch gate;
- human editorial review status counts;
- current 64-art production status counts;
- SHA-256 + byte length for release-critical source/config manifests;
- every ordered SQL migration plus an aggregate migration-set SHA-256;
- GitHub Actions run identity when generated in CI.

## Explicit non-claims

Every pack also records:

- `production_deployment_proven=false`;
- `scientific_validation_proven=false`;
- `public_taxonomy_approved=false`.

This prevents a reproducible beta build artifact from being mistaken for production or psychometric evidence.

## Secret boundary

The generator reads only repository files and GitHub run/source identity. It must not read:

- `DATABASE_URL`;
- rate-limit secrets;
- AI/provider credentials;
- cookies/tokens;
- diagnostic data.

CI uploads only the generated JSON with 30-day artifact retention.

## Release use

For a later production candidate, retain the green-run pack beside deployment/container digest, migration rehearsal, production evidence registry records and final model/content/art approvals. The pack can then answer exactly which source bytes and version tuple those observations correspond to.
