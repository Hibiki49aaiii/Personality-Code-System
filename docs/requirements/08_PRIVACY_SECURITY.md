# 08 — Privacy and Security Requirements

## Master-ID reservation

`REQUIREMENTS.md` owns the top-level meanings of **PCS-PRIV-001..004**, **PCS-SEC-001**, and **PCS-LEGAL-001**. This derivative file MUST NOT redefine them. Detailed data-minimization clauses use **PCS-PRIV-010+**.

## Privacy principle

PCS handles potentially intimate personality-response data. Collect less, separate identity from answers where possible, make sharing explicit, and avoid exporting diagnostic data to unrelated third parties.

## Data minimization

- **PCS-PRIV-010** Account is not required to take the assessment.
- **PCS-PRIV-011** Do not request real name, address, phone, employer, precise location, health history, political/religious identity, sexual data, or other sensitive demographics unless a later feature has a documented legitimate need and explicit consent.
- **PCS-PRIV-012** Demographic calibration questions, if later added, must be optional and separately explained.
- **PCS-PRIV-013** Diagnostic answers/scores MUST NOT be placed into ordinary third-party product analytics event properties.
- **PCS-PRIV-014** Public sharing is opt-in; completing the test alone does not make a profile public.

### Current enforceable data-minimization implementation

The current development implementation closes the Master **PCS-PRIV-002** engineering gate through an explicit allowlist inventory rather than an informal review:

- `data/privacy/data-inventory-v0.1-dev.json` assigns every migration-created PostgreSQL table exactly once to one of seven documented privacy classes;
- every class records purpose, personal-data status, retention basis/window, `public_by_default=false`, and `third_party_export_default=false`;
- the ordinary anonymous assessment does not collect real name, email, telephone, postal address, precise geolocation, employer, health history, political/religious identity, sexual data, or biometric media;
- `scripts/validate-privacy-data-inventory.mjs` fails CI for an unregistered/unknown table, missing purpose/retention, public/export defaults, or common direct collection capabilities such as email/tel inputs, geolocation, media capture, or contact access;
- `docs/model/DATA_MINIMIZATION_SPEC_v0.1.md` defines the change gate for future collection, retention, analytics/share allowlists, disclosure/consent, and traceability updates.

CI Run 373 (`33050505946`) is the current evidence checkpoint for this contract. This is an engineering/data-governance completion only; Privacy Policy/Terms/consent wording remains **PCS-LEGAL-001**.

## Current anonymous-flow and security controls

The implemented anonymous assessment flow currently provides:

- no account requirement;
- 256-bit opaque bearer token generation;
- SHA-256 hash-only token storage in PostgreSQL;
- HttpOnly, SameSite=Lax browser cookie transport;
- `Secure` cookie behavior in production mode;
- no session token or raw answers in URLs;
- server-side item/value validation;
- session-model-bound answer persistence;
- immutable private result snapshots;
- private result retrieval only through the anonymous bearer cookie;
- a browser E2E assertion that a fresh browser context without the cookie cannot access the completed result.

These controls are sufficient evidence for Master **PCS-PRIV-001** at the current anonymous-flow level.

### Current user-controlled anonymous diagnostic deletion

The development application now implements an explicit destructive privacy path rather than relying only on future retention jobs:

- `DELETE /api/assessment/data` requires the private HttpOnly session capability;
- `assertTrustedMutationRequest()` rejects cross-site deletion attempts before destructive work;
- a dedicated `data-deletion` HMAC rate-limit scope is session-bound;
- the UI requires an explicit second confirmation and states that the operation cannot be undone;
- derived `public_share_snapshots` are physically deleted before deleting the owning private session;
- deleting `anonymous_sessions` cascades to answers, Trait Scores, private result snapshots and session-bound product events;
- migration `0006_privacy_delete_cascade_guards.sql` permits only the parent-session cascade path while continuing to reject direct deletion/mutation of completed child rows;
- the private session cookie is cleared after successful deletion;
- `data/privacy/user-deletion-v0.1-dev.json` and `npm run validate:user-deletion` keep the ownership, scope, rate-limit, CSRF, cascade and remaining launch blockers machine-auditable.

This advances the deletion portion of **PCS-LEGAL-001**, but does not close it. Production retention scheduling, backup restore/deletion behavior, final legal wording/contact route and jurisdiction-specific review remain release blockers.

## Current security hardening implementation

The development application now also provides:

- versioned rate-limit policy `rate-limits-v0.1-dev`;
- PostgreSQL fixed-window rate-limit buckets for session creation, answer mutation, completion, share mutation, destructive data deletion and analytics ingestion;
- HMAC-SHA256 bucket principals; raw IP addresses and private session tokens are not persisted in the rate-limit table;
- privacy-safe 429 responses with `Retry-After` and no principal/bucket/token details;
- production requires an external `PCS_RATE_LIMIT_SECRET` of at least 32 characters;
- global CSP, frame denial, content-type protection, Referrer Policy and Permissions Policy;
- production HSTS;
- production dependency vulnerability audit in CI at high severity or above;
- machine validation of the security-header/rate-limit policy contract;
- expired rate-limit buckets are included in the dry-run-first retention cleanup command;
- `poweredByHeader: false` suppresses the default Next.js framework disclosure and production browser source maps remain disabled;
- `scripts/validate-release-security.mjs` rejects runtime AI/LLM dependencies/imports, sensitive `NEXT_PUBLIC_*` names, obvious committed credentials/private keys, unsafe dynamic HTML/code execution primitives, and server-only environment references from Client Components;
- `scripts/audit-production-build.mjs` scans production client artifacts for source maps and configured/server-only secret identifiers or values;
- `assertTrustedMutationRequest()` rejects cross-site state-changing requests before rate-limit/DB mutation work, and Chromium E2E verifies hostile Origin/Sec-Fetch-Site requests cannot save answers, complete assessments, create/revoke shares, or delete diagnostic data;
- rejected mutation/error responses are checked for absence of attacker-controlled origins, secrets, stack details, and hash-like internal identifiers.

Verification evidence includes CI Run `33038326772` (Run 304) for the earlier rate-limit/security-header baseline and CI Run 373 (`33050505946`) for the current privacy inventory, release-security audit, typecheck/build, production-artifact audit, and Chromium security regression suite.

The IP-based session-creation limit assumes the production reverse proxy/CDN overwrites or sanitizes forwarded client-address headers. Trusted-proxy behavior is therefore a deployment requirement and is not claimed by application code alone.

This completes the enumerated Master **PCS-SEC-001** development implementation. It does **not** complete release security: TLS termination, trusted proxy configuration, production database least privilege, deployment secret-store proof, external penetration/security review and the final **PCS-QA-007** checklist remain release/operations gates.

## Data classification

At minimum classify:

1. Public assets/content.
2. Operational metadata.
3. Anonymous diagnostic answers.
4. Derived diagnostic scores/results.
5. Optional account identifiers.
6. Public share snapshot chosen by user.

Access/logging/retention rules SHOULD differ by class.

## Retention

Before production launch define:

- abandoned anonymous session retention;
- completed raw-answer retention;
- derived result retention;
- share-result retention/deletion behavior;
- operational logs;
- backups;
- calibration datasets.

Retention periods MUST be documented to users where legally/ethically relevant and implementable in deletion tooling.

Current pre-legal engineering defaults are documented in `docs/model/PERSISTENCE_RETENTION_BASELINE_v0.1.md`; they are not final public legal promises.

### Current scheduled-retention engineering implementation

The repository now enforces the pre-legal diagnostic retention baseline as executable engineering behavior:

- `data/privacy/diagnostic-retention-v0.1-dev.json` is the machine policy;
- migration `0007_diagnostic_retention_answer_guard.sql` allows completed raw-answer deletion only after 90 days while keeping younger completed answers immutable;
- `scripts/cleanup-diagnostic-retention.mjs` is dry-run by default and requires an explicit version acknowledgement for execution;
- real PostgreSQL integration verifies abandoned-session deletion at 30 days, raw-answer deletion at 90 days, private-result/session/Trait-score deletion at 180 days, and active public-share revocation/detachment when its private source ages out;
- CI also executes the production-shaped cleanup command in dry-run mode.

This materially closes the **engineering tooling** gap behind the stated retention baseline. It does not prove a production scheduler is running and does not define how provider backups behave after source deletion; those remain PCS-LEGAL-001 / OPS / release evidence.

## User controls

Where data is persisted beyond a short anonymous session, the product MUST define how users can:

- understand what is stored;
- delete a saved/shareable result where ownership can be safely established;
- revoke/disable a public result link if supported;
- avoid optional analytics/tracking where required.

## Analytics privacy

Allowed default analytics properties include coarse operational data such as:

- event name;
- assessment model version;
- item position/index;
- viewport category;
- completion state;
- share method;
- non-sensitive performance/error metadata.

Disallowed by default:

- exact raw answer values tied to third-party identifiers;
- full trait vector;
- Core/Extended Code if sent to a third-party analytics vendor without explicit review;
- result prose;
- free-form personal text.

First-party statistical/calibration storage is separate from third-party analytics and must have its own data model/access policy.

## Security baseline

- TLS/HTTPS in production.
- Secure, HttpOnly, SameSite cookies where cookies carry session/auth state.
- High-entropy opaque tokens.
- Server-side validation for all writes.
- CSRF protection appropriate to architecture.
- Rate limiting/abuse controls for public mutation endpoints.
- Security headers (CSP where practical, HSTS, frame restrictions, content-type protections).
- Dependency vulnerability review and automated update/security alerts.
- Secrets in deployment secret store only.
- No secrets committed to Git.
- No AI API keys required by production.
- Database principle of least privilege.
- Sensitive logs minimized/redacted.

## Public share security

- Share IDs must be unguessable.
- Raw answers must never be retrievable through public result endpoints.
- Public result endpoint returns only the approved share/result snapshot fields.
- Private internal IDs SHOULD not be exposed unless harmless and intentionally stable.
- Search-engine indexing policy must be explicit; default should be `noindex` for non-public/private result routes.

Phase 4A implements the public snapshot as a separate explicit export rather than reusing the private bearer token. Public share persistence is created only by explicit mutation, uses a separate opaque hash-only capability, and is independently revocable.

## Threat cases to test

- modifying item IDs/answer values;
- submitting answers for inactive model versions;
- replay/double-submit;
- enumerating result/share IDs;
- XSS through localized/content data;
- injection against persistence layer;
- forged public-result creation;
- excessive assessment/session creation;
- unauthorized deletion/update;
- accidental exposure through logs/analytics/OG generation.

Current automated coverage includes off-model item rejection, invalid value rejection, completed-session mutation rejection, duplicate finalization/idempotency behavior, hash-only session/share credentials, private-result browser isolation, sanitized public-share boundaries, analytics leakage rejection, security-header assertions, excessive session-creation rate limiting with privacy-safe 429 behavior, hostile cross-site mutation rejection before persistence, release static scanning, and production client-artifact leakage checks. Remaining deployment/external-review threat cases stay release-blocking where applicable.

## Legal/consent pages before launch

The current implementation-grounded disclosure draft is `docs/legal/PUBLIC_LEGAL_DISCLOSURE_DRAFT_v0.1.md`, backed by `data/legal/legal-disclosure-v0.1-dev.json` and `scripts/validate-legal-disclosure-draft.mjs`. It is intentionally non-public/non-approved and exists to prevent final legal text from drifting away from actual retention/share/analytics behavior.

MUST provide or finalize as applicable:

- Privacy Policy;
- Terms of Use;
- diagnostic/non-clinical limitations;
- cookie/analytics disclosure and consent where required;
- data retention/deletion explanation;
- contact route for privacy/security requests.

Legal text must match actual implementation; boilerplate that claims nonexistent practices is prohibited.
