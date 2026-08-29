# Issue #22 — Implementation Plan

## Goal

Define the engineering governance contract for future calibration data retention/deletion and operator authorization/audit before any runtime calibration export exists.

## Base

- Repository: `Hibiki49aaiii/Personality-Code-System`
- Base SHA: `d01ff75fe5c0eeef053c85a16a29e9e5bcc34489`
- Branch: `issue-22-calibration-governance-policy`

## Current State

- Wave JA-01 is registration-ready but not externally preregistered.
- calibration collection/export/start are false.
- consent receipt table exists but the normal runtime DB role has zero privileges.
- no runtime calibration API/export job exists.
- protocol prerequisites `retention-deletion-policy` and `operator-authorization-audit` are still pending governance.

## Target State

Add an explicit engineering policy with:
- row-level calibration artifact retention ceiling;
- withdrawal/self-deletion handling;
- aggregate/reproducibility retention distinction;
- operator roles;
- two-person raw-export approval;
- mandatory audit metadata;
- sensitive audit-field prohibition;
- explicit implementation status flags.

Advance protocol prerequisite statuses only to:

`engineering-policy-ready-implementation-pending`

This MUST NOT be interpreted as activation readiness.

## Design

### Retention
- row-level calibration artifacts: maximum 180 days after wave close;
- withdrawal/self-deletion takes precedence over time-based retention;
- withdrawn records must be excluded before next analysis/export materialization;
- offline artifacts must be regenerated/purged before further use;
- aggregate reports may outlive row-level records only when they contain no row-level/linkage/re-identification data;
- operator audit metadata: 365-day engineering baseline.

### Authorization
Roles:
- `calibration-export-requester`
- `calibration-export-approver`
- `calibration-privacy-operator`
- `calibration-reviewer`

Raw calibration export requires:
- explicit version/scope tuple;
- requester and approver must differ;
- two-person approval;
- artifact digest;
- purpose/reason code;
- no browser/public API surface;
- no ordinary application runtime role access.

### Audit
Audit records may contain only bounded operational metadata.

Required examples:
- event ID;
- action;
- requester/approver operator IDs;
- exact wave/export/model scope;
- row count;
- artifact SHA-256 when applicable;
- occurred-at/expiry/disposition.

Forbidden:
- raw responses;
- bearer/token/hash;
- session ID;
- participant identity/contact/location;
- result prose;
- free-form participant data.

## Files

### Add
- `data/calibration/governance-policy-v0.1-dev.json`
- `docs/model/CALIBRATION_GOVERNANCE_POLICY_v0.1.md`
- `scripts/validate-calibration-governance.mjs`
- this plan

### Modify
- `package.json`
- `data/calibration/beta-protocol-v0.1-dev.json`
- `data/calibration/consent-purpose-v0.1-dev.json`
- `docs/model/BETA_CALIBRATION_PROTOCOL_v0.1.md`
- `docs/model/CALIBRATION_EXPORT_SPEC_v0.1.md`
- `docs/model/PERSISTENCE_RETENTION_BASELINE_v0.1.md`
- `data/privacy/data-inventory-v0.1-dev.json`
- optionally threat-model wording if needed for consistency

## Runtime / Data Flow

No new runtime data flow.

Only:

`governance policy -> validator -> CI`

Future export/audit materialization remains a separate Issue.

## Failure Behavior

CI fails if:
- collection/export flags are enabled;
- legal approval is falsely asserted;
- retention windows drift;
- raw export stops requiring two-person approval;
- requester and approver may be the same;
- forbidden participant/diagnostic fields appear in audit schema;
- runtime/web export route is marked allowed;
- audit storage or deletion queue is falsely marked implemented.

## Security / Privacy

- no new DB table;
- no new runtime role privilege;
- no personal demographic data;
- no participant free text;
- no session capability in audit;
- no automatic third-party upload.

## Verification

- `npm run validate:calibration`
- normal CI
- CodeQL
- privacy/release/security validators
- PostgreSQL integration
- typecheck/build
- 147-item Chromium E2E

## Rollback

Documentation/config/validator-only rollback. No participant data or runtime schema exists to migrate.

## Human Understanding

### What
A pre-implementation governance contract for future calibration data and operators.

### Why
A consented research export cannot be safely implemented until deletion and operator accountability are specified first.

### Important decisions
- 180-day row-level research artifact ceiling;
- 365-day operator audit metadata baseline;
- withdrawal overrides retention;
- two-person raw-export approval;
- audit metadata never contains raw diagnostic data.

### Invariants
- no runtime export yet;
- no legal approval claim;
- no ordinary runtime DB access;
- no automatic third-party upload;
- policy-ready != implementation-ready != activation-ready.
