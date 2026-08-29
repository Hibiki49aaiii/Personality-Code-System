# Issue #31 — Implementation Plan

## Goal
Complete the offline calibration export request/review/two-person decision control plane without adding any raw materializer.

## Base
- Main SHA: b436047d2ee342a6337cfcda9328640dc054b04b
- CI #779 / CodeQL #112 / Container Package #55: green

## Human Understanding
The DB already stores requester/approver roles and immutable request state, but operators cannot safely use it. Direct table permissions would make the DB credential itself an impersonation capability. Therefore all operator-sensitive control actions go through execute-only SECURITY DEFINER functions that verify the credential-derived hash and role inside PostgreSQL.

## Trust Boundaries
- pcs_runtime: unchanged, zero calibration-plane access
- pcs_calibration_auth: EXECUTE authenticate only, zero table access
- pcs_calibration_admin: operator/role lifecycle only
- pcs_calibration_export_control: EXECUTE authenticate/request/review/decide only, zero table access
- migration owner: creates functions/roles/grants; not used for normal operator actions

## Migration 0010
Create:
1. pcs_authenticate_calibration_operator(hash)
2. pcs_request_calibration_export(hash, purpose, exact scope...)
3. pcs_review_calibration_export_request(hash, request_id)
4. pcs_decide_calibration_export_request(hash, request_id, decision)

Rules:
- SECURITY DEFINER
- SET search_path = pg_catalog
- all application objects fully qualified with public.
- REVOKE ALL FROM PUBLIC
- malformed/unknown/revoked credentials fail closed
- request requires calibration-export-requester
- review requires approver or reviewer
- decide requires approver
- requester != approver
- request row locked for decision
- decision only from requested state
- update + audit insert are one function statement/transaction
- raw response/artifact fields are not touched

## CLI
New script: scripts/calibration-export-control.mjs

Commands:
- request --purpose-code
- review --request-id
- approve --request-id
- reject --request-id

Environment:
- PCS_CALIBRATION_EXPORT_CONTROL_DATABASE_URL
- PCS_CALIBRATION_OPERATOR_TOKEN

Request scope is loaded only from:
- beta-wave-ja-01-draft.json
- beta-wave-ja-01-scope-freeze-v0.1-dev.json
- consent-purpose-v0.1-dev.json
- export-schema-v0.1-dev.json

No version/scope argv switches exist.

## Auth hardening
Update existing whoami to call pcs_authenticate_calibration_operator rather than SELECT operator tables.

Update DB role policy/grants so pcs_calibration_auth has zero direct table privileges.

## Tests
### Unit
- parse purpose/request IDs
- token argv forbidden
- repository scope builder exactness
- bounded error mapping

### PostgreSQL
- create auth/admin/control roles
- apply reviewed grant template
- prove exact table privilege matrices
- issue requester/approver/reviewer credentials
- whoami works with zero table SELECT
- requester creates request
- approver reviews exact scope
- requester self-approval rejected even if requester also has approver role
- unrelated/reviewer-only cannot decide
- approver approves
- exactly one export-approved audit event exists
- second decision rejected
- separate request rejection creates export-rejected audit
- revoked/unknown token fails
- control role cannot SELECT/INSERT/UPDATE/DELETE any application table or CREATE schema objects

## Governance State
This issue may set an export-control implementation flag true.
It must not set:
- raw_export_materializer_implemented
- collection_enabled
- export_enabled
- production_operator_provisioning_complete
- deletion_queue_implemented

## Rollback
Migration is additive functions only. Forward-fix by replacing/revoking functions. No participant data or export artifact is created.

## Verification
Full CI, CodeQL, typecheck, production build, Chromium E2E, release evidence.
