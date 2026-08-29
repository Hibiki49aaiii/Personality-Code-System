# Issue #26 — Implementation Plan

## Goal

Implement a non-web calibration operator credential/authentication and role-management CLI while keeping raw calibration collection/export absent.

## Base

- Main SHA: 35fc23c41c007b980eee6f58e2e973297b798662
- CI #775: success
- CodeQL #108: success
- Container Package #53: success

## Trust Boundary

ordinary web runtime != calibration auth CLI != calibration admin CLI != migration admin

The ordinary Next.js runtime remains unable to access every calibration operator-plane table.

## Refined Database Role Design

### pcs_calibration_auth

Purpose: authenticate an operator token and read its role membership.

Allowed:
- CONNECT database
- USAGE public schema
- SELECT calibration_operators
- SELECT calibration_operator_roles

Denied:
- all writes
- all participant/consent/export/audit/link/deletion/session/result/answer tables
- schema CREATE and DDL

### pcs_calibration_admin

Purpose: issue/revoke pseudonymous operator credentials and manage role rows without using the migration owner.

Allowed:
- CONNECT database
- USAGE public schema
- SELECT/INSERT/UPDATE calibration_operators
- SELECT/INSERT/DELETE calibration_operator_roles

Denied:
- DELETE calibration_operators
- all calibration participant/export/audit/link/deletion tables
- all ordinary session/result/answer tables
- schema CREATE and DDL

The database trigger from migration 0009 already limits operator UPDATE to active -> revoked and blocks physical operator deletion.

## CLI Commands

### issue

Inputs:
- PCS_CALIBRATION_OPERATOR_ADMIN_DATABASE_URL
- PCS_CALIBRATION_OPERATOR_ADMIN_ACK exact policy value
- one or more --role values from allowlist
- --credential-out explicit file path

Behavior:
1. validate args and environment;
2. generate randomBytes(32) base64url credential;
3. hash SHA-256 locally;
4. create credential file exclusively with mode 0600;
5. transactionally insert operator hash + roles;
6. if DB insert fails, remove the just-created credential file;
7. emit secret-free JSON metadata only.

The raw credential is never accepted on argv and never printed.

### grant-role / revoke-role / revoke-credential

Inputs:
- admin DB URL + acknowledgement
- --operator-id UUID
- --role when applicable

Behavior:
- validate fixed role allowlist;
- require target operator existence;
- grant only to active operators;
- role operations are idempotence-aware and fail clearly on invalid state;
- revoke credential uses the existing DB revocation-only update guard;
- output contains no credential material.

### whoami

Inputs:
- PCS_CALIBRATION_AUTH_DATABASE_URL
- PCS_CALIBRATION_OPERATOR_TOKEN

Behavior:
- no token argv option exists;
- canonical token format is validated;
- SHA-256 hash is queried through pcs_calibration_auth;
- unknown/revoked/malformed tokens return the same AUTHENTICATION_FAILED class;
- successful output contains only operatorId, status=active and sorted roles.

## Secret Handling

- credential output target must not exist;
- open flag wx;
- mode 0600;
- credential file contains the raw token plus a trailing newline only;
- stdout/stderr never include token/hash/database URL;
- CLI catches errors and emits bounded error codes without stack traces;
- tests capture stdout/stderr and search for token/hash leakage.

## Policy Contracts

Add:
- data/calibration/operator-auth-policy-v0.1-dev.json
- data/security/calibration-operator-db-role-policy-v0.1-dev.json
- ops/sql/calibration-operator-role-grants.sql

The machine policy freezes env names, commands, role allowlist, file mode, token format and DB privilege matrices.

## Validation

Static validator checks:
- policy version/status;
- exact role allowlist;
- no web surface;
- no raw export enablement;
- fixed env names;
- 32-byte / 43-char / SHA-256 contract;
- exclusive 0600 credential output;
- exact auth/admin DB grant template;
- no calibration runtime API.

## Integration Tests

### CLI lifecycle

Using real PostgreSQL roles:
1. create pcs_calibration_admin and pcs_calibration_auth test logins;
2. apply reviewed grant template;
3. issue operator through CLI;
4. assert credential file 0600 and token format;
5. assert stdout/stderr exclude token/hash;
6. whoami succeeds through auth-only role;
7. grant role through admin role;
8. whoami shows sorted role set;
9. revoke role;
10. revoke credential;
11. whoami returns AUTHENTICATION_FAILED;
12. malformed token returns same bounded authentication error.

### DB least privilege

For every migration-created table verify exact has_table_privilege matrix for pcs_calibration_auth and pcs_calibration_admin.

Also prove:
- auth role cannot INSERT/UPDATE/DELETE operators/roles;
- admin role cannot read anonymous_sessions, assessment_answers, consent receipts, export requests, audit events, record links or deletion events;
- neither role can CREATE table or ALTER application table.

## Governance State Transition

After tests pass:
- operator_authentication_implemented = true
- operator_audit_storage_implemented remains true
- raw_export_materializer_implemented remains false
- targeted deletion executor remains false
- collection_enabled/export_enabled remain false

Replace repository implementation blocker:
- operator-authentication-command-and-role-binding

with deployment/manual blocker:
- operator-production-provisioning-evidence

This distinguishes implemented tooling from actual production operator provisioning.

## Out of Scope

- raw answer materialization
- export request/approval CLI
- artifact storage
- purge executor
- web admin UI
- external IdP
- production secrets
- external preregistration/legal approval

## Rollback

No participant/calibration data is created by CI. SQL grant templates are repository contracts only. Revert the branch/PR before production use if needed.

## Human Understanding

### What
Create the missing operator credential lifecycle without opening a web/admin endpoint.

### Why
The DB already knows operator IDs and roles, but humans currently have no safe tool to issue or authenticate credentials.

### Key decision
Use two dedicated least-privilege DB roles: read-only authentication and narrowly writable credential administration.

### Invariants
- raw token outside DB;
- token never argv/stdout;
- ordinary runtime remains zero-access;
- no raw export;
- no production activation;
- implemented tooling does not equal deployed operator evidence.