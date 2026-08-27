# 11 — Release and Operations Requirements

## Environment strategy

PCS MUST maintain distinct environments for:

- local/development;
- preview/staging;
- production.

Production diagnostic models/content versions must not be mutated casually from development data.

## Environment contract evidence

`docs/operations/ENVIRONMENT_CONTRACT_v0.1.md` and `data/operations/environment-contract-v0.1-dev.json` now define development/preview/production boundaries, server-only environment variables, TLS/database separation requirements, production AI-key prohibition and the exact external evidence still required before OPS-001/002 can close. `scripts/validate-environment-contract.mjs` keeps the repository from claiming deployed separation prematurely.

## Deployment

- Production deployment must be reproducible from version-controlled source.
- CI must pass before normal production promotion.
- Deployment platform choice may evolve; infrastructure-specific decisions should be recorded as ADRs.
- Environment variables/secrets are managed outside Git.
- Production must not require an AI/LLM/generative service credential.

## Database operations

Before storing production diagnostic data:

- [x] migration framework selected; *(PostgreSQL + Drizzle + committed ordered SQL migrations.)*
- [ ] staging migration tested;
- [ ] backup strategy defined;
- [ ] restore procedure tested at least once before broad launch;
- [ ] destructive migration review procedure defined;
- [x] published model/version records protected from unintended deletion/modification; *(PostgreSQL immutability triggers + integration tests.)*
- [x] retention cleanup jobs tested against fixtures. *(Versioned analytics retention policy, real PostgreSQL cleanup integration and CI dry-run command.)*

## Observability

Production SHOULD provide:

- application error monitoring;
- server/API error rates;
- diagnostic finalization failure rate;
- database health/latency;
- deployment/version identifier;
- Web Vital/performance visibility;
- alerting for severe availability/error regressions.

Logs MUST avoid raw answers and unnecessary diagnostic profiles by default.

## Current development observability foundation

The current application provides a privacy-minimized foundation, not final production observability:

- `client_error` analytics accepts only fixed category/surface enums; free-form message/stack fields are rejected by the event validator/API;
- App Router error boundaries and assessment/share failure paths emit only fixed categories;
- Web Vitals are reduced to `LCP|INP|CLS|TTFB` plus `good|needs-improvement|poor`; raw metric value, delta and ID are not sent;
- `GET /api/health` checks PostgreSQL readiness and returns only `{"status":"ok"}` or `{"status":"degraded"}`, with no connection/version/exception details;
- analytics retention uses versioned 30-day unscoped / 90-day session-bound windows;
- `npm run cleanup:analytics` is dry-run by default and requires `--execute` for deletion;
- CI executes the retention command in dry-run mode on every run.

Evidence checkpoints:

- CI Run 269 (`33037531921`): fixed error telemetry browser flow;
- CI Run 270 (`33037562880`): retention policy/repository/CLI dry-run with the full suite;
- CI Run 272 (`33037608636`): minimal readiness endpoint and E2E.

Still required for production:

- external or independently durable application/server error monitoring;
- server/API error-rate and finalization-failure dashboards;
- database latency/availability metrics independent of the primary database;
- deployment/version correlation;
- alert routing/escalation;
- production retention scheduler execution evidence;
- development/preview/production environment separation.

## Repository-enforced release/rollback foundation

The repository now carries a machine-readable release policy, the exact `assessment-dev-v0.3` beta release manifest, and a six-domain rollback runbook:

- `data/release/release-policy-v0.1-dev.json`;
- `data/release/assessment-dev-v0.3.json`;
- `docs/model/ASSESSMENT_MODEL_RELEASE_CONTRACT_v0.1.md`;
- `docs/operations/ROLLBACK_RUNBOOK_v0.1.md`;
- `scripts/validate-release-operations.mjs`.

The validator requires development/preview/production environment classes, secrets outside Git, no production AI runtime credential, green-CI promotion, immutable published versions, explicit model/content/migration/rollback checks, and application/database/model/content/asset/share-card rollback coverage.

The current C01D beta manifest is intentionally `production_activation_allowed=false`; this foundation does not fabricate production environment, backup/restore or Phase 5 evidence.

## Model release lifecycle

Assessment models require a separate lifecycle from ordinary UI deploys.

Suggested states:

`draft -> internal-test -> beta -> frozen/published -> retired`

Publishing a model requires:

- version ID assigned;
- trait dictionary/scoring/item set frozen;
- required deterministic tests passing;
- item/content compatibility verified;
- migration/data implications reviewed;
- release notes created;
- rollback/fallback behavior defined.

A UI deploy MUST NOT silently alter which assessment model users receive unless explicitly configured/released.

## Content/illustration releases

Content and illustration versions may release independently only if historical result snapshot integrity is preserved.

Changes that alter diagnostic claims SHOULD create a new content version. Cosmetic typo fixes may follow a documented low-risk policy, but historical snapshots must remain auditable.

## Rollback

The repository-level procedure is now documented in `docs/operations/ROLLBACK_RUNBOOK_v0.1.md` and machine-checked for all required rollback domains. CI Run 383 passed this contract, completing Master **PCS-OPS-004** as a documented rollback requirement. Deployment-provider commands, restore rehearsal evidence and responsible contacts remain environment-specific release evidence under the remaining operations/launch gates.

Production rollback procedure MUST address separately:

- application code rollback;
- database migration rollback/forward-fix;
- active assessment model rollback;
- content/asset rollback;
- public share-card template rollback.

Never “rollback” by rewriting an already published version in place.

## Incident priorities

P0/P1 examples:

- wrong diagnostic outputs at scale;
- raw answer/private result exposure;
- public share authorization failure;
- data corruption/loss;
- site broadly unavailable;
- malicious content execution.

Incidents affecting diagnostic correctness require identifying impacted model/version/session ranges so affected results can be invalidated or clearly marked if necessary.

## Pre-launch gate

Public v1.0 launch requires all of the following or an explicit documented exception approved in requirements:

- [ ] production build/test suite green;
- [ ] deterministic scoring/code/content snapshots green;
- [ ] responsive/mobile QA complete;
- [ ] accessibility core-flow QA complete;
- [ ] privacy/security audit checklist complete;
- [ ] privacy policy/terms/limitations published;
- [ ] error monitoring operational;
- [ ] production database backup/restore readiness;
- [ ] active model version frozen/documented;
- [ ] content/type catalog complete for every reachable Core Type;
- [ ] every reachable Core Type has valid illustration/fallback;
- [ ] share metadata/cards validated if sharing is enabled;
- [ ] analytics payload audit confirms no prohibited answer leakage;
- [ ] rollback procedure documented;
- [ ] no production AI runtime dependency.

## Version/release naming

Use distinct concepts:

- application release/version;
- assessment model version;
- code schema version;
- content version;
- asset/template version.

Do not overload a single “v1” string to mean all of them internally.
