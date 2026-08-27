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

## Current security hardening implementation

The development application now also provides:

- versioned rate-limit policy `rate-limits-v0.1-dev`;
- PostgreSQL fixed-window rate-limit buckets for session creation, answer mutation, completion, share mutation and analytics ingestion;
- HMAC-SHA256 bucket principals; raw IP addresses and private session tokens are not persisted in the rate-limit table;
- privacy-safe 429 responses with `Retry-After` and no principal/bucket/token details;
- production requires an external `PCS_RATE_LIMIT_SECRET` of at least 32 characters;
- global CSP, frame denial, content-type protection, Referrer Policy and Permissions Policy;
- production HSTS;
- production dependency vulnerability audit in CI at high severity or above;
- machine validation of the security-header/rate-limit policy contract;
- expired rate-limit buckets are included in the dry-run-first retention cleanup command.

Verification evidence includes CI Run `33038326772` (Run 304), which passes rate-limit persistence, production build, security-header E2E and the API-boundary 429 test.

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

No public share endpoint exists in Phase 2C. Phase 4 must implement the public snapshot as a separate explicit export rather than reusing the private bearer token.

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

Current automated coverage includes off-model item rejection, invalid value rejection, completed-session mutation rejection, duplicate finalization/idempotency behavior, hash-only session/share credentials, private-result browser isolation, sanitized public-share boundaries, analytics leakage rejection, security-header assertions, and excessive session-creation rate limiting with privacy-safe 429 behavior. Remaining threat cases stay release-blocking where applicable.

## Legal/consent pages before launch

MUST provide or finalize as applicable:

- Privacy Policy;
- Terms of Use;
- diagnostic/non-clinical limitations;
- cookie/analytics disclosure and consent where required;
- data retention/deletion explanation;
- contact route for privacy/security requests.

Legal text must match actual implementation; boilerplate that claims nonexistent practices is prohibited.
