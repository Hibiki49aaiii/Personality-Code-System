# Issue #24 — Implementation Plan

## Goal

Implement a fail-closed persistence foundation for the calibration research operator plane without adding any public/runtime calibration collection or raw-export surface.

## Base

- Repository: Hibiki49aaiii/Personality-Code-System
- Base SHA: 8a75765277f2b258a27d3f544dab412f866a625b
- Branch: issue-24-calibration-operator-plane

## Current State

Issue #22 defined the governance policy but the following implementation flags remain false:
- operator authentication;
- operator audit storage;
- raw export materializer;
- targeted calibration-record deletion.

The normal application runtime DB role also has zero calibration-consent access and must remain unable to access future operator-plane tables.

## Target Architecture

### Trust boundary

ordinary web runtime != calibration operator plane

The web runtime continues to use pcs_runtime and receives no permissions on operator-plane tables.

A future dedicated operator command/runtime can authenticate separately and use a dedicated DB role. This Issue does not create that runtime yet.

### Operator identity

Use a 256-bit opaque capability:
- raw token generated outside storage;
- SHA-256 hex only persisted;
- unique credential hash;
- active/revoked lifecycle;
- role membership stored separately.

This mirrors the project's existing session/share capability design without reusing those capabilities.

### Tables

#### calibration_operators
- operator_id UUID
- credential_hash CHAR(64), unique
- status active/revoked
- created/revoked timestamps

No real name/email field.

#### calibration_operator_roles
- operator_id
- role enum
- composite PK
- role membership stored separately

#### calibration_export_requests
Immutable scope:
- requester
- purpose
- wave/export-schema/consent/model/item/scoring/Trait Dictionary/locale
State:
- requested / approved / rejected
- approver + decision timestamp
Rules:
- requester != approver
- approved/rejected requires approver and decided_at
- request scope/requester immutable
- no materialized/artifact payload yet

#### calibration_operator_audit_events
Append-only bounded metadata:
- event/action
- requester/approver
- purpose/scope
- optional row count / artifact SHA-256
- disposition
- occurred_at

DB trigger rejects UPDATE/DELETE.

#### calibration_record_links
- calibration_record_id UUID
- consent_receipt_id unique
- created_at

No session_id/token field. Link exists only to consent receipt.

#### calibration_deletion_events
Append-only:
- deletion_event_id UUID
- calibration_record_id
- reason enum: consent-withdrawn / owner-session-deleted / privacy-operator-purge
- occurred_at

No FK back to active record link so events survive link deletion. DB trigger rejects UPDATE/DELETE.

## Trigger Flow

### Consent withdrawal
calibration_consent_receipts granted -> withdrawn
-> find calibration_record_links
-> append calibration_deletion_events(reason=consent-withdrawn)

### Consent/session deletion
BEFORE DELETE consent receipt
-> append deletion event for linked record
-> FK cascade removes calibration_record_links
-> deletion journal survives

A unique index on calibration_record_id + reason prevents duplicate same-reason events.

## Operator Credential Helper

Add a pure TypeScript helper:
- canonical 32-byte base64url token
- SHA-256 hash
- timing-safe verification
- no environment access

No CLI or DB authorization use in this Issue.

## Database Permissions

Update policy so new tables are:
- explicitly inventoried in privacy inventory;
- explicitly present in runtime privilege map;
- listed in runtime_no_access_tables;
- absent from runtime grant SQL.

The least-privilege integration test must prove all four DML privileges are false for every new operator-plane table.

## Schema Validation

Update persistence validator to require:
- all six tables;
- operator hash check/unique constraint;
- requester/approver separation;
- export request lifecycle trigger;
- append-only audit trigger;
- consent-withdrawal deletion trigger;
- consent-delete deletion trigger;
- append-only deletion-event trigger.

Update PostgreSQL migration ordering fixture to include migration 0009.

## Governance Status

After successful implementation, only these flags may advance:
- operator_audit_storage_implemented = true
- targeted calibration record deletion linkage/journal foundation = true

Operator authentication stays false because no operator-facing auth command/runtime exists yet.

Raw export materializer stays false.

The policy language must distinguish targeted deletion journal/linkage foundation implemented from actual exported-artifact purge executor not yet implemented.

## Security / Privacy

No:
- real name/email;
- participant session ID in audit/deletion event;
- raw answers;
- public/private bearer token;
- IP/location;
- result prose;
- demographic/free text.

Credential hash is security material and must not be logged/exported.

## Tests

- token helper unit tests
- PostgreSQL integration: valid operator/role creation
- duplicate credential hash rejected
- requester self-approval rejected
- invalid transition rejected
- audit UPDATE/DELETE rejected
- withdrawal emits deletion event
- session delete emits deletion event and removes link
- deletion journal survives
- least privilege runtime denial
- privacy inventory
- persistence schema validator
- calibration governance validator
- normal full CI/CodeQL

## Rollback

Migration 0009 is additive. Production has no calibration operator data yet. Repository rollback is code revert; production migration rollback, if ever applied, requires explicit DB migration review and is outside this development-only Issue.

## Human Understanding

### What
A durable, private operator-plane data model before privileged calibration tooling exists.

### Why
Two-person approval and withdrawal handling cannot be reliably retrofitted after raw research exports begin.

### Important decisions
- separate operator capability;
- hash-only credential;
- no identity/contact fields;
- append-only audit and deletion journal;
- deletion event survives active-link cascade;
- runtime role receives zero privileges.

### Invariants
- no raw export;
- no web calibration route;
- no normal runtime DB access;
- no false operator-authentication claim;
- no participant/session identity in audit/deletion journal.

### Failure modes
- trigger duplication -> prevented by unique same-reason event constraint;
- self-approval -> DB check;
- audit tampering -> append-only trigger;
- session deletion loses research deletion target -> BEFORE DELETE journal event survives;
- runtime compromise accesses operator plane -> zero runtime grants.