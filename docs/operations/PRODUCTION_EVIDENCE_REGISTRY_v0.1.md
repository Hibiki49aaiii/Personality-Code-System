# PRODUCTION_EVIDENCE_REGISTRY_v0.1

> Status: canonical registry active; all production/public evidence pending
> Candidate model: `assessment-dev-v0.3`

## Purpose

Release blockers previously appeared as independent `pending` strings in the public-launch gate and production-model activation gate.

`data/release/production-evidence-registry-v0.1-dev.json` now provides one canonical evidence identity for those requirements and binds each identity back to the exact gate key(s).

## Completion rule

Changing an evidence entry from `pending` to `complete` requires an evidence object containing:

- `artifact_ref` — an inspectable external/manual/research/release record;
- `observed_at` — when the evidence was actually observed;
- `reviewer`;
- `environment`;
- `notes`.

Placeholder values such as TODO/TBD/pending/example are prohibited.

The registry does not make evidence true. It makes unsupported status flips machine-detectable.

## Canonical evidence classes

The registry currently joins 16 evidence identities across:

- deployment/environment/TLS/secrets/database/proxy;
- backup/restore privacy;
- independent monitoring;
- real accessibility;
- external security;
- final legal/privacy review;
- field performance;
- public code schema;
- Phase 5 calibration;
- migration rehearsal;
- human editorial approval;
- approved public art mapping.

Several canonical records bind to differently named keys in both launch and model-activation gates. CI requires exact coverage with no missing or duplicate bindings.

## Current state

All entries remain `pending`. This is correct.

Repository tests, lab evidence, non-root packages, logical DB restore and other engineering foundations are not substitutes for the specific production/manual evidence represented here.
