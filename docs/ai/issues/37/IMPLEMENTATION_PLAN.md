# Issue #37 — Implementation Plan

## Goal

Implement a two-person, offline, execute-only row-level calibration purge executor for already-authorized privacy deletion targets.

## Base

- main SHA: 20fcbe8175672e122465d2d33a23ed16d2dbc12b
- CI #816: success
- CodeQL #149: success
- Container Package #58: success

## Human Understanding

### What
Turn existing pseudonymous deletion journal events into an actual, authorized deletion of retained calibration row data.

### Why
The repository can already identify records that must no longer remain active after consent withdrawal, owner deletion, or retest-pair invalidation, but it cannot yet execute that row-level purge under a controlled operator workflow.

### What this does not mean
- collection is not enabled;
- raw export is not enabled;
- no production role/secret is provisioned;
- no offline export artifact exists or is purged;
- no legal/preregistration/environment gate is satisfied.

## Trust Boundary

ordinary runtime
!= calibration auth
!= calibration admin
!= export control
!= privacy purge control
!= migration owner

The new privacy role gets no direct table privileges.

## Architecture

### Selected
Execute-only SECURITY DEFINER purge workflow:
1. privacy operator requests purge for one pseudonymous calibration record;
2. DB proves a qualifying pre-existing privacy event;
3. DB expands eligible retest-pair members;
4. reviewer inspects bounded targets;
5. distinct reviewer confirms or rejects;
6. confirm revalidates eligibility and atomically deletes current row-level records.

### Rejected
- direct DELETE grant to an operator DB role;
- single-person delete function;
- runtime/web endpoint.

## Persistence

Migration 0013 adds:

### calibration_privacy_purge_requests
- purge_request_id UUID PK
- requester_operator_id FK
- reviewer_operator_id nullable FK
- status requested/confirmed/rejected
- requested_at
- decided_at
- target_count
- immutable request identity

### calibration_privacy_purge_request_targets
- purge_request_id FK
- calibration_record_id UUID
- qualifying_reason
- PK(request_id, record_id)
- bounded pseudonymous target identity only

Targets intentionally do not FK to calibration_records because the retained governance request must survive record deletion.

## Qualifying Reasons

Request eligibility is based on existing events only:
- consent-withdrawn
- owner-session-deleted
- retest-pair-invalidated

privacy-operator-purge is execution evidence and never grants initial eligibility.

## Pair Expansion

For a retest-linked record:
- inspect retest linkage before deletion;
- include each still-present pair member that has a retest-pair-invalidated event;
- never add an unjournaled pair member.

This lets the already-existing pair invalidation journal determine purge scope.

## DB API

Functions:
- pcs_request_calibration_privacy_purge(hash, calibration_record_id)
- pcs_review_calibration_privacy_purge(hash, purge_request_id)
- pcs_decide_calibration_privacy_purge(hash, purge_request_id, decision)

All:
- SECURITY DEFINER
- search_path=pg_catalog
- public-qualified application objects
- REVOKE ALL FROM PUBLIC

Request:
- requires active calibration-privacy-operator
- rejects record not currently present
- rejects no qualifying event
- creates exact immutable target set

Review:
- requires active calibration-reviewer
- returns bounded request/target metadata only

Decision:
- requires active calibration-reviewer
- requester != reviewer
- request row FOR UPDATE
- decision confirmed/rejected only once
- confirm rechecks every target still has qualifying privacy event
- inserts privacy-operator-purge event for still-present targets
- deletes matching calibration_records
- updates request
- writes bounded operator audit:
  - privacy-purge-confirmed on confirm
  - add privacy-purge-rejected action on reject

## Audit Schema Adjustment

Migration 0013 extends calibration_operator_audit_events action allowlist with:
- privacy-purge-rejected

Existing privacy role validation remains:
- requester: calibration-privacy-operator
- reviewer: calibration-reviewer

Audit stores no answer/session/contact/retest-token data.

## DB Role

pcs_calibration_privacy_control:
- USAGE public
- zero direct table privileges
- EXECUTE:
  - pcs_authenticate_calibration_operator(text)
  - request/review/decide privacy purge functions
- no DDL

## CLI

scripts/calibration-privacy-purge.mjs

Commands:
- request --calibration-record-id UUID
- review --purge-request-id UUID
- confirm --purge-request-id UUID
- reject --purge-request-id UUID

Env:
- PCS_CALIBRATION_PRIVACY_CONTROL_DATABASE_URL
- PCS_CALIBRATION_OPERATOR_TOKEN

No token argv.
No raw response output.
No direct DB table queries.

## Fail-Closed Behavior

- missing/no-event record: reject
- already-purged record: reject new request
- revoked/unknown token: reject
- wrong role: reject
- self-confirm: reject
- repeat decision: reject
- target event disappears: impossible because journal append-only; still revalidated
- row already absent between request/confirm: confirmation may report fewer deleted rows but request target history remains
- no artifact purge claim because no artifact exists

## Governance Transition

After verified implementation:
- targeted_calibration_record_deletion_implemented = true
- row_level_purge_executor_implemented = true
- artifact_purge_executor_implemented = false
- raw_export_materializer_implemented = false
- collection/export remain false

Change retention prerequisite from:
policy-and-deletion-journal-ready-purge-executor-pending

to:
row-purge-executor-ready-artifact-purge-coupled-to-future-materializer

Future materializer activation must be rejected unless artifact lineage/purge/regeneration is added simultaneously.

## Tests

### Unit
- CLI parse UUIDs
- no token argv
- bounded commands
- safe error mapping

### PostgreSQL
- all role/table privilege matrices
- function EXECUTE matrices
- create real calibration records/answers
- no-event request denied
- consent-withdrawn request accepted
- reviewer review succeeds
- requester self-confirm denied even if dual-role
- reject leaves rows intact
- confirm deletes calibration_records + item responses
- deletion journal survives
- privacy-operator-purge marker exists
- audit confirmed/rejected bounded
- retest pair invalidation request expands/deletes both rows
- repeat decision denied
- revoked/unknown token denied
- privacy role cannot direct SELECT/DELETE tables

## Source-of-Truth Sync

Update:
- calibration governance/protocol
- privacy data inventory
- DB role policy/grant template
- retention baseline
- requirements/traceability/delivery phases
- threat model/change ledger
- release evidence identity contract

## Rollback

Migration is additive plus one audit-action check expansion. No production data exists. Before activation, rollback is repository-level revert/forward-fix.

## Verification

Full CI + CodeQL + typecheck + build + standalone smoke + Chromium E2E + release evidence pack.
