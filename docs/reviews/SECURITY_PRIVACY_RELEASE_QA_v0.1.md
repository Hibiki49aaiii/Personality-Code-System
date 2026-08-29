# Security / Privacy Release QA v0.1

> Status: **manual/deployment review NOT RUN**
> Record: `data/security/security-privacy-release-review-v0.1-dev.json`
> Master gate: PCS-QA-007

## Automated foundation already covered

The current repository already blocks or tests:

- runtime AI/LLM dependencies and related runtime imports;
- obvious committed secrets/private keys and sensitive public environment names;
- production client bundle leakage/source maps;
- required security headers;
- cross-site state-changing requests through Origin / Fetch Metadata guards, including session creation/resume and first-party client analytics ingestion; the security baseline validator freezes guard coverage for the current mutation-route inventory;
- privacy-safe rate-limit and rejection responses;
- production client-address resolution is fail-closed unless an explicit `PCS_CLIENT_IP_HEADER` is selected from the versioned allowlist; arbitrary/non-IP-shaped header values are rejected;
- `database-role-policy-v0.1-dev` exactly covers every current runtime table with table-specific privileges, and CI creates a real restricted PostgreSQL login proving representative runtime DML works while CREATE/ALTER and definition writes are denied;
- an isolated logical backup/restore rehearsal compares every application-table row count, trigger count and post-restore published-model immutability without uploading the diagnostic dump;
- unexpected runtime faults use a fixed three-field schema (`event`, bounded `surface`, bounded `category`); CI rejects direct runtime `console.error` bypasses so exception/request/token/answer/result objects are not accidentally serialized by application code;
- migration-to-privacy-inventory exact coverage;
- production dependency vulnerability audit;
- Chromium security regression flows.

These are necessary but do not prove the deployed edge/database/secret-store configuration.

## Deployment/manual checklist

| Control | Evidence to capture | Status |
| --- | --- | --- |
| TLS termination | canonical production URL, certificate/TLS observation | NOT RUN |
| HSTS | production response observation after TLS deployment | NOT RUN |
| Trusted proxy | edge/CDN config showing the selected `PCS_CLIENT_IP_HEADER` is overwritten/sanitized before reaching the app; production app code already refuses to guess another forwarded header | NOT RUN |
| DB least privilege | production runtime role/grants vs migration/admin role; repository policy/template + CI restricted-role proof already exist | NOT RUN |
| Secret store | provider/project secret configuration without exposing values | NOT RUN |
| Secret rotation | documented/rehearsed rotation path for DB/rate-limit secrets | NOT RUN |
| Environment separation | preview/prod deployment + database identities | NOT RUN |
| Backup/restore | provider-level production-equivalent restore, deletion-journal replay, retention cleanup and public-share non-resurrection; repository logical restore rehearsal already exists | NOT RUN |
| External security review | independent review / penetration report and resolved findings | NOT RUN |
| Production logs | provider/log pipeline retention/access/enrichment review; application-side fixed-schema logging already forbids diagnostic exception payloads | NOT RUN |

## Manual attack cases

Where the real deployment permits it, explicitly test:

- spoofed forwarded client-address headers cannot bypass the trusted edge policy; verify the configured `PCS_CLIENT_IP_HEADER` is edge-owned, and that unselected forwarded headers are ignored by the production app;
- application runtime credentials cannot perform schema/admin actions beyond required runtime behavior;
- secrets are not readable through client assets, error pages, framework diagnostics or public logs;
- public-share and private-session capabilities never appear in edge analytics/logs beyond explicitly approved narrow operational handling;
- backups and deployment control-plane access follow least privilege.

## Closure

Do not mark PCS-QA-007 complete by copying CI results into this file. Each deployment/manual control requires real production or production-equivalent evidence.

Any exception must identify:

- control;
- reason;
- risk owner;
- mitigation;
- expiry/review date;
- affected release.
