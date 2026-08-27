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
- cross-site state-changing requests through Origin / Fetch Metadata guards;
- privacy-safe rate-limit and rejection responses;
- production client-address resolution is fail-closed unless an explicit `PCS_CLIENT_IP_HEADER` is selected from the versioned allowlist; arbitrary/non-IP-shaped header values are rejected;
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
| DB least privilege | production runtime role/grants vs migration/admin role | NOT RUN |
| Secret store | provider/project secret configuration without exposing values | NOT RUN |
| Secret rotation | documented/rehearsed rotation path for DB/rate-limit secrets | NOT RUN |
| Environment separation | preview/prod deployment + database identities | NOT RUN |
| Backup/restore | actual restore rehearsal evidence | NOT RUN |
| External security review | independent review / penetration report and resolved findings | NOT RUN |
| Production logs | provider/log pipeline review proving diagnostic secrets/answers are not emitted | NOT RUN |

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
