# SECURITY_THREAT_MODEL_v0.1

> Status: repository threat review active; external security review pending
> Contract: `data/security/threat-model-v0.1-dev.json`

## Scope

The PCS threat model follows assets and trust boundaries rather than claiming a formal certification.

Current coverage includes:

- private assessment capability;
- sanitized public-share capability;
- mutation/CSRF boundary;
- edge/client-address trust;
- analytics and runtime-log privacy;
- public/private snapshot separation;
- model/content/result integrity;
- runtime database privileges;
- backup deletion resurrection;
- dependency/secret/container exposure;
- runtime AI prohibition;
- pre-launch crawler exposure;
- calibration consent/operator-authentication boundary.

## Status semantics

- `mitigated-repository` — repository implementation/tests provide the current mitigation; ordinary future changes can still regress it.
- `partial-external` — meaningful repository mitigation exists, but a production/provider/manual property remains unproven and is bound to a canonical production evidence ID.
- `deferred-fail-closed` — functionality intentionally stays absent/blocked until prerequisites exist.

No threat is marked “eliminated”.

## External review handoff

An external reviewer should use the machine model together with:

- security/privacy release QA;
- production evidence registry;
- deployment probe output;
- release-candidate evidence pack;
- DB least-privilege policy/integration;
- backup/restore privacy runbook;
- sanitized share tests;
- analytics/log privacy contracts.

External findings should add issue/evidence references and, where material, a requirement/change-ledger entry rather than silently editing threat status.
