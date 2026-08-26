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

## Current Phase 2C private-flow controls

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

These controls are sufficient evidence for Master **PCS-PRIV-001** at the current anonymous-flow level. They do **not** complete the full Master **PCS-SEC-001** requirement because rate limiting, complete security headers, dependency-security automation and release security review remain open.

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

Current automated coverage includes off-model item rejection, invalid value rejection, completed-session mutation rejection, duplicate finalization/idempotency behavior, hash-only session credentials and private-result browser isolation. Remaining threat cases stay release-blocking where applicable.

## Legal/consent pages before launch

MUST provide or finalize as applicable:

- Privacy Policy;
- Terms of Use;
- diagnostic/non-clinical limitations;
- cookie/analytics disclosure and consent where required;
- data retention/deletion explanation;
- contact route for privacy/security requests.

Legal text must match actual implementation; boilerplate that claims nonexistent practices is prohibited.
