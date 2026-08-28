# DEPLOYMENT_PROBE_v0.1

> Provider-independent operator tool
> This tool does not automatically mark any production evidence complete.

## Purpose

`scripts/probe-deployment.mjs` turns several OPS/QA deployment observations into one repeatable HTTP probe instead of a screenshot-only checklist.

It checks:

- production HTTPS requirement;
- `/api/health` status, no-store and noindex behavior;
- landing availability;
- CSP/frame/nosniff/referrer/permissions headers;
- absence of `X-Powered-By`;
- production one-year HSTS + includeSubDomains;
- `/robots.txt`;
- pre-launch noindex/disallow-all or post-launch indexability mode.

## Usage

Pre-launch preview:

```bash
npm run probe:deployment -- --base-url https://preview.example --environment preview --mode prelaunch --output evidence/preview-probe.json
```

Production pre-launch:

```bash
npm run probe:deployment -- --base-url https://example.com --environment production --mode prelaunch --output evidence/production-prelaunch-probe.json
```

After an authorized public launch, use `--mode public` to prove stale noindex/disallow-all controls were actually removed.

## Evidence boundary

A successful JSON report can become one input to the canonical production evidence registry, but it is not sufficient by itself for environment separation, trusted proxy ownership, secret rotation, database grants, backup privacy, legal review or external security review.

The operator still records artifact reference, observation time, reviewer/environment and release decision in the evidence registry/change process.
