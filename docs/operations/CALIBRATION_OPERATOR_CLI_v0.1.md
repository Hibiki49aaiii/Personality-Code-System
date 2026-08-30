# Calibration Operator CLI v0.1

> Status: repository engineering tooling / calibration collection and raw export remain disabled  
> Machine policy: `data/calibration/operator-auth-policy-v0.1-dev.json`

## Purpose

This CLI manages pseudonymous calibration operator credentials and role membership outside the web runtime.

It does **not**:
- collect participant calibration responses;
- materialize raw calibration exports;
- create a web/admin endpoint;
- provision production secrets automatically;
- satisfy legal/privacy/preregistration/environment activation gates.

## Trust boundaries

Five database credentials remain separate:

1. ordinary application runtime — `pcs_runtime`
2. calibration authentication — `pcs_calibration_auth`
3. calibration credential administration — `pcs_calibration_admin`
4. calibration export control — `pcs_calibration_export_control`
5. calibration privacy purge control — `pcs_calibration_privacy_control`

The migration/admin owner is only needed to create the fixed DB roles and apply the reviewed grant template. Normal operator credential lifecycle commands use the narrower calibration roles.

Grant template:

`ops/sql/calibration-operator-role-grants.sql`

## Secret rules

- Operator token entropy: 32 random bytes.
- Encoding: base64url, 43 characters.
- Database identity: SHA-256 hex only.
- The raw token must never be stored in the database.
- The raw token must never be placed on the command line.
- The raw token must never be printed to stdout/stderr.
- `issue` writes it once to an explicit file created with exclusive mode and `0600` permissions.
- `whoami` reads it only from `PCS_CALIBRATION_OPERATOR_TOKEN`.
- Do not commit credential files.
- Do not put operator credentials into the web/runtime environment.

## Required environment variables

### Administrative mutations

```sh
export PCS_CALIBRATION_OPERATOR_ADMIN_DATABASE_URL='postgres://...'
export PCS_CALIBRATION_OPERATOR_ADMIN_ACK='calibration-operator-admin-v0.1-dev'
```

The URL must authenticate as the dedicated calibration admin role or an equivalent reviewed least-privilege principal.

### Authentication

```sh
export PCS_CALIBRATION_AUTH_DATABASE_URL='postgres://...'
export PCS_CALIBRATION_OPERATOR_TOKEN='...'
```

The auth URL should authenticate as `pcs_calibration_auth` or an equivalent reviewed execute-only principal. It has no direct operator-table SELECT; `whoami` calls the bounded `pcs_authenticate_calibration_operator` SECURITY DEFINER function.

## Issue an operator

Choose the initial roles deliberately.

```sh
npm run operator:calibration -- issue \
  --role calibration-reviewer \
  --credential-out /secure/operator-credential.txt
```

The command prints only bounded metadata such as the pseudonymous operator UUID, status and roles.

The raw credential exists only in the requested output file.

Immediately transfer/store that file through the approved secret-handling process. Do not copy it into shell history, tickets, chat, GitHub Issues or logs.

## Authenticate / inspect roles

Set the raw credential through the environment, not argv:

```sh
export PCS_CALIBRATION_OPERATOR_TOKEN="$(cat /secure/operator-credential.txt)"
npm run operator:calibration -- whoami
unset PCS_CALIBRATION_OPERATOR_TOKEN
```

Successful output contains:
- operator ID;
- active status;
- sorted role list.

Malformed, unknown and revoked credentials intentionally return the same `AUTHENTICATION_FAILED` class.

## Grant a role

```sh
npm run operator:calibration -- grant-role \
  --operator-id 00000000-0000-4000-8000-000000000000 \
  --role calibration-reviewer
```

Allowed roles are fixed by the machine policy:
- `calibration-export-requester`
- `calibration-export-approver`
- `calibration-privacy-operator`
- `calibration-reviewer`

No arbitrary/admin role string is accepted.

## Revoke a role

```sh
npm run operator:calibration -- revoke-role \
  --operator-id 00000000-0000-4000-8000-000000000000 \
  --role calibration-reviewer
```

Role removal does not rotate or reveal the credential.

## Revoke a credential

```sh
npm run operator:calibration -- revoke-credential \
  --operator-id 00000000-0000-4000-8000-000000000000
```

Revocation is one-way in v0.1.

To rotate a credential:
1. issue a new operator credential;
2. assign reviewed roles;
3. verify `whoami`;
4. revoke the old operator credential.

Do not attempt to reactivate a revoked row.

## Database roles

### pcs_calibration_auth

Allowed:
- schema `USAGE`;
- EXECUTE on `pcs_authenticate_calibration_operator(text)`.

Denied:
- **all direct table privileges**, including operator credential hashes;
- participant/session/result/answer data;
- consent receipts;
- export request/audit/link/deletion tables;
- schema CREATE / DDL.

### pcs_calibration_export_control

Allowed:
- schema `USAGE`;
- EXECUTE only on bounded authentication/request/review/decision functions.

Denied:
- all direct table privileges;
- operator hash enumeration;
- raw response/materialization data;
- schema CREATE / DDL.

See `docs/operations/CALIBRATION_EXPORT_CONTROL_CLI_v0.1.md`.

### pcs_calibration_privacy_control

Allowed:
- schema `USAGE`;
- EXECUTE only on bounded authentication and privacy-purge request/review/decision functions.

Denied:
- all direct table privileges;
- arbitrary calibration-record deletion;
- operator hash enumeration;
- raw answer/session/result data;
- schema CREATE / DDL.

See `docs/operations/CALIBRATION_PRIVACY_PURGE_CLI_v0.1.md`.

### pcs_calibration_admin

Allowed:
- schema `USAGE`;
- `SELECT, INSERT, UPDATE` on `calibration_operators`;
- `SELECT, INSERT, DELETE` on `calibration_operator_roles`.

The database itself further restricts operator UPDATE to active → revoked and prohibits physical operator deletion.

Denied:
- participant/session/result/answer data;
- consent receipts;
- export request/audit/link/deletion tables;
- schema CREATE / DDL.

## Production boundary

Repository tests prove the intended SQL role matrix, but this does not prove production roles or credentials exist.

Before calibration activation, capture inspectable deployment evidence for:
- actual `pcs_calibration_auth` equivalent identity;
- actual `pcs_calibration_admin` equivalent identity;
- actual `pcs_calibration_export_control` equivalent identity;
- actual `pcs_calibration_privacy_control` equivalent identity;
- actual grants;
- operator credential provisioning/revocation procedure;
- production environment separation.

That evidence is tracked separately from repository implementation.

## Verification

CI covers:
- CLI argument/secret handling;
- canonical token/hash behavior;
- exclusive `0600` credential file creation;
- raw-token/hash stdout/stderr leak checks;
- real PostgreSQL `issue → whoami → grant → revoke-role → revoke-credential` lifecycle;
- exact auth/admin/export-control/privacy-control privilege and function-EXECUTE matrix across all application objects;
- DDL denial;
- calibration governance still fail-closed for raw export and collection.
