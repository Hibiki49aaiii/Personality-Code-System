# 08 — Privacy and Security Requirements

## Privacy principle

PCS handles potentially intimate personality-response data. Collect less, separate identity from answers where possible, make sharing explicit, and avoid exporting diagnostic data to unrelated third parties.

## Data minimization

- **PCS-PRIV-001** Account is not required to take the assessment.
- **PCS-PRIV-002** Do not request real name, address, phone, employer, precise location, health history, political/religious identity, sexual data, or other sensitive demographics unless a later feature has a documented legitimate need and explicit consent.
- **PCS-PRIV-003** Demographic calibration questions, if later added, must be optional and separately explained.
- **PCS-PRIV-004** Diagnostic answers/scores MUST NOT be placed into ordinary third-party product analytics event properties.
- **PCS-PRIV-005** Public sharing is opt-in; completing the test alone does not make a profile public.

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

## Legal/consent pages before launch

MUST provide or finalize as applicable:

- Privacy Policy;
- Terms of Use;
- diagnostic/non-clinical limitations;
- cookie/analytics disclosure and consent where required;
- data retention/deletion explanation;
- contact route for privacy/security requests.

Legal text must match actual implementation; boilerplate that claims nonexistent practices is prohibited.
