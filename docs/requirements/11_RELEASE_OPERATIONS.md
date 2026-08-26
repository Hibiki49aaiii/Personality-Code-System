# 11 — Release and Operations Requirements

## Environment strategy

PCS MUST maintain distinct environments for:

- local/development;
- preview/staging;
- production.

Production diagnostic models/content versions must not be mutated casually from development data.

## Deployment

- Production deployment must be reproducible from version-controlled source.
- CI must pass before normal production promotion.
- Deployment platform choice may evolve; infrastructure-specific decisions should be recorded as ADRs.
- Environment variables/secrets are managed outside Git.
- Production must not require an AI/LLM/generative service credential.

## Database operations

Before storing production diagnostic data:

- [ ] migration framework selected;
- [ ] staging migration tested;
- [ ] backup strategy defined;
- [ ] restore procedure tested at least once before broad launch;
- [ ] destructive migration review procedure defined;
- [ ] published model/version records protected from unintended deletion/modification;
- [ ] retention cleanup jobs tested against fixtures.

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
