# Environment Separation Contract v0.1

> Status: repository contract only — deployed separation is **not yet proven**
> Version: `environment-contract-v0.1-dev`
> Date: 2026-08-27

## Purpose

Define what PCS means by development, preview, and production environments before a hosting platform is selected/configured. The repository can enforce required boundaries and fail closed on unsafe assumptions, but it cannot prove that two external deployments/databases/secrets actually exist.

Therefore this contract advances OPS-001/002 without closing them.

## Environment classes

### Development

Used for local/CI engineering. It may use ephemeral/test credentials and does not count as production evidence.

### Preview

Must use:

- TLS;
- a database identity distinct from production;
- preview-only secrets;
- explicit `PCS_SITE_ORIGIN`;
- explicit `PCS_ASSESSMENT_MODEL_VERSION`;
- no production traffic/production secrets.

### Production

Must use:

- TLS and the real canonical origin;
- production-only database credentials;
- an external secret store;
- explicit active assessment model version;
- independent monitoring/backup/restore evidence;
- trusted-proxy configuration before forwarded client IP headers are trusted.

## Environment variable classes

| Variable | Class | Preview | Production | Client exposure |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | secret | required | required | prohibited |
| `PCS_RATE_LIMIT_SECRET` | secret | required | required, ≥32 chars | prohibited |
| `PCS_SITE_ORIGIN` | configuration | required | required HTTPS | prohibited |
| `PCS_ASSESSMENT_MODEL_VERSION` | release configuration | required | required | prohibited |

The repository already has separate static/build guards for sensitive `NEXT_PUBLIC_*` names and production client-bundle leakage.

## AI runtime credential boundary

Production PCS does not require or permit an AI/LLM service credential for diagnosis/result generation.

The environment contract explicitly forbids production runtime credentials such as OpenAI/Anthropic/Google generative/Cohere keys. Development tooling outside shipped runtime is governed separately and must never turn into a production dependency.

## Trusted proxy boundary

The current IP-based session-creation rate limiter reads forwarded address headers. That is only safe when the production reverse proxy/CDN overwrites/sanitizes those headers.

The repository cannot prove this deployment property. Trusted-proxy configuration therefore remains an explicit external security/QA evidence item.

## Database least privilege

Production database credentials must not be assumed equivalent to CI/local credentials. The production application role should have only the privileges required by runtime queries, while migration/administrative capabilities should be separated where the hosting model permits.

Actual grants/roles are deployment evidence and remain open.

## Evidence required to close OPS-001

- distinct preview and production deployment identities;
- distinct preview and production database identities;
- production domain/TLS evidence.

## Evidence required to close OPS-002

- external deployment secret-store evidence;
- secret rotation procedure;
- successful production client-artifact leakage audit against deployed configuration.

## Automated repository evidence

`scripts/validate-environment-contract.mjs` verifies:

- all three environment classes remain defined;
- preview/production require distinct databases and TLS;
- required server-only variables are classified and cannot be exposed client-side;
- production runtime AI credentials remain forbidden;
- the repository does not falsely claim deployed environment separation;
- current runtime source still contains the production Secure-cookie and rate-limit-secret safeguards;
- required external evidence lists remain non-empty.

A hosting/deployment change must update this contract and its evidence rather than silently redefining what “production” means.
