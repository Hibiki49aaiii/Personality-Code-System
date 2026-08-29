# Calibration Export Control CLI v0.1

> Status: repository engineering control plane / raw calibration materialization remains disabled  
> Machine policy: `data/calibration/export-control-policy-v0.1-dev.json`

## Purpose

This CLI manages the governance state **before** any raw calibration materialization exists:

- create a scoped export request;
- inspect the exact frozen request scope;
- approve or reject through a distinct operator;
- write the bounded append-only decision audit.

It does not:
- collect calibration answers;
- read participant/session/result/answer tables;
- create an export artifact;
- upload data;
- satisfy production/legal/preregistration gates.

## Database boundary

Normal control operations use `pcs_calibration_export_control`.

That role has:
- schema `USAGE`;
- **zero direct table privileges**;
- EXECUTE only on:
  - `pcs_authenticate_calibration_operator(text)`
  - `pcs_request_calibration_export(...)`
  - `pcs_review_calibration_export_request(text, uuid)`
  - `pcs_decide_calibration_export_request(text, uuid, text)`

The functions are `SECURITY DEFINER`, use `search_path=pg_catalog`, qualify application objects with `public.`, and are revoked from `PUBLIC`.

Possession of the control DB credential alone therefore does not expose operator credential hashes or allow direct request/audit table mutation.

## Operator credential

The raw token is read only from:

```sh
export PCS_CALIBRATION_OPERATOR_TOKEN="$(cat /secure/operator-credential.txt)"
```

Never pass it as argv.

The control DB URL is provided separately:

```sh
export PCS_CALIBRATION_EXPORT_CONTROL_DATABASE_URL='postgres://...'
```

Do not place either credential in the web/runtime environment.

## Request

Requester must have `calibration-export-requester`.

```sh
npm run operator:calibration-export-control -- request \
  --purpose-code wave-primary-analysis
```

The operator supplies only a bounded purpose code.

The exact wave/model/item/scoring/Trait/locale scope is loaded from repository contracts and independently rechecked by PostgreSQL. Version/scope argv options are forbidden.

Current fixed repository scope:
- wave: `beta-ja-wave-01-draft`
- export schema: `calibration-export-record-v0.1-dev`
- consent: `calibration-consent-ja-v0.1-dev`
- assessment: `assessment-dev-v0.3`
- item bank: `item-bank-v0.2`
- scoring: `scoring-v0.1-dev`
- Trait Dictionary: `trait-dictionary-v0.2`
- locale: `ja-JP`

This scope is repository-frozen but not externally preregistered.

## Review

A `calibration-export-approver` or `calibration-reviewer` may inspect bounded request metadata:

```sh
npm run operator:calibration-export-control -- review \
  --request-id 00000000-0000-4000-8000-000000000000
```

Review output contains no raw responses, credential hashes, participant identifiers, session capability or artifact.

## Approve

A distinct active `calibration-export-approver` may decide:

```sh
npm run operator:calibration-export-control -- approve \
  --request-id 00000000-0000-4000-8000-000000000000
```

The database locks the request, verifies it is still `requested`, verifies requester ≠ approver, updates the request and inserts one `export-approved` audit event atomically.

Approval does **not** create a raw export artifact.

## Reject

```sh
npm run operator:calibration-export-control -- reject \
  --request-id 00000000-0000-4000-8000-000000000000
```

This writes one bounded `export-rejected` audit event atomically.

## Fail-closed rules

- unknown/malformed/revoked operator credentials cannot request/review/decide;
- requester role is required for request;
- approver/reviewer role is required for review;
- approver role is required for decision;
- self-approval is rejected even if one operator holds both requester and approver roles;
- decided requests cannot be decided again;
- alternate model/version scope passed through direct SQL is rejected;
- control/auth roles cannot directly read operator hashes or request/audit tables;
- no runtime calibration API exists.

## Production boundary

Repository tests prove the intended behavior only in CI PostgreSQL.

Before any production use, separately prove:
- actual control-role identity and grants;
- production operator credentials;
- legal/privacy approval;
- external preregistration;
- production environment separation;
- raw materializer + artifact retention/purge behavior.

Until those gates exist, collection/export remain disabled.
