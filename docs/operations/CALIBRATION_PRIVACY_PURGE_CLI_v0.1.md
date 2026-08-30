# Calibration Privacy Purge CLI v0.1

> Status: repository engineering row-purge control / calibration collection and raw materialization remain disabled  
> Machine policy: `data/calibration/privacy-purge-policy-v0.1-dev.json`

## Purpose

This CLI executes **row-level database purge** for calibration records that have already been marked by a qualifying privacy deletion event.

It is not a general-purpose delete command.

A purge request can only target a current `calibration_records` row that already has at least one of:

- `consent-withdrawn`
- `owner-session-deleted`
- `retest-pair-invalidated`

The execution marker `privacy-operator-purge` does not make a record eligible by itself.

## Two-person authorization

Request:
- active `calibration-privacy-operator`

Review / confirm / reject:
- active `calibration-reviewer`
- must be a different operator from the requester

Even an operator holding both roles cannot review or confirm their own purge request.

## Database boundary

Normal purge operations use `pcs_calibration_privacy_control`.

That role has:
- schema `USAGE`;
- **zero direct table privileges**;
- EXECUTE only on:
  - `pcs_authenticate_calibration_operator(text)`
  - `pcs_request_calibration_privacy_purge(text, uuid)`
  - `pcs_review_calibration_privacy_purge(text, uuid)`
  - `pcs_decide_calibration_privacy_purge(text, uuid, text)`

The purge functions are `SECURITY DEFINER`, use `search_path=pg_catalog`, qualify application objects with `public.`, and are revoked from `PUBLIC`.

Possession of the privacy-control database credential therefore does not allow direct calibration-record inspection or deletion.

## Required environment

```sh
export PCS_CALIBRATION_PRIVACY_CONTROL_DATABASE_URL='postgres://...'
export PCS_CALIBRATION_OPERATOR_TOKEN="$(cat /secure/operator-credential.txt)"
```

Never pass the operator token on argv and never place these credentials in the ordinary web runtime environment.

## Request

```sh
npm run operator:calibration-purge -- request \
  --calibration-record-id 00000000-0000-4000-8000-000000000000
```

The database verifies:
1. the operator is active and has the privacy-operator role;
2. the row still exists;
3. a qualifying privacy deletion event already exists;
4. no overlapping requested purge already covers the target.

For a current retest pair, the request expands to every still-present pair member that has its own qualifying deletion event. An unjournaled pair member is never inferred into the purge.

## Review

```sh
npm run operator:calibration-purge -- review \
  --purge-request-id 00000000-0000-4000-8000-000000000000
```

Review output is limited to:
- pseudonymous purge request ID;
- pseudonymous operator IDs;
- status/timestamps;
- target count;
- pseudonymous calibration record IDs;
- qualifying deletion reason.

It does not expose answers, session capability, contact/identity data, trait scores, result prose or retest credential hashes.

## Confirm

```sh
npm run operator:calibration-purge -- confirm \
  --purge-request-id 00000000-0000-4000-8000-000000000000
```

Confirmation:
1. locks the request;
2. revalidates requester/reviewer roles and distinctness;
3. revalidates target evidence;
4. adds a `privacy-operator-purge` execution marker for each still-present target;
5. deletes matching `calibration_records`;
6. lets existing cascades remove item responses and current retest linkage;
7. keeps deletion-journal and purge-governance evidence;
8. writes a bounded `privacy-purge-confirmed` audit event.

## Reject

```sh
npm run operator:calibration-purge -- reject \
  --purge-request-id 00000000-0000-4000-8000-000000000000
```

Rejection deletes no calibration data and writes a bounded `privacy-purge-rejected` audit event.

## Retest pair behavior

When consent withdrawal invalidates a claimed retest pair, the existing retest trigger journals `retest-pair-invalidated` for both pseudonymous record IDs.

A purge requested against either still-present member therefore expands to both eligible members and confirmation removes both row-level records in one transaction.

## Artifact boundary

This implementation does **not** claim purge of exported files/object-store artifacts.

There is currently no raw calibration materializer or artifact store.

Any future materializer must be rejected unless the same change also introduces:
- artifact registry/lineage from pseudonymous calibration record IDs;
- exclusion of withdrawn/purged records from materialization;
- artifact purge/regeneration;
- tests proving a purged record cannot survive in an active artifact.

Machine policy keeps that coupling fail-closed.

## Production boundary

Repository CI proving this workflow does not prove production provisioning.

Before production use, separate evidence is required for:
- actual `pcs_calibration_privacy_control` identity and grants;
- production operator/reviewer credentials;
- final legal/privacy approval;
- external preregistration;
- environment separation;
- backup/restore deletion replay;
- retention scheduling.

Until those gates pass, calibration collection/export remain disabled.
