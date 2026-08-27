# RUNTIME_LOG_PRIVACY_v0.1

> Status: repository enforcement complete; production log-provider review pending
> Contract: `data/security/runtime-log-policy-v0.1-dev.json`

## Goal

Operational errors must be visible without turning runtime logs into a copy of diagnostic/private data.

## Fixed schema

Unexpected server faults are emitted only as:

- `event = pcs_server_fault`;
- bounded `surface`;
- bounded `category`.

The logger does not accept an `Error`, request, URL, headers, cookies, token, answer, Trait/result payload, stack or free-form message.

This means unknown exception objects from assessment, analytics, public-share rendering, OG/card rendering, result rendering and health checks are no longer passed directly to `console.error`.

## CI enforcement

`scripts/validate-runtime-log-privacy.mjs` recursively inspects runtime TypeScript under `src/` and permits direct `console.error` only inside `src/server/privacySafeLog.ts`. Any future bypass fails CI.

## Production evidence still required

Repository enforcement cannot prove how a hosting provider enriches/accesses/retains stdout/stderr. Before PCS-QA-007 / PCS-OPS-003 can close, record:

- provider/log sink identity;
- retention policy;
- operator/access policy;
- representative payload/redaction review;
- proof bearer/share capabilities and diagnostic data are not exported.
