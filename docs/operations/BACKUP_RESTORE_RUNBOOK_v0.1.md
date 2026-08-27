# BACKUP_RESTORE_RUNBOOK_v0.1

> Status: repository logical-restore rehearsal implemented; production provider/privacy restore evidence pending
> Contract: `data/operations/backup-restore-policy-v0.1-dev.json`

## Why restore is a privacy operation

A backup created before a user deletes diagnostic data or revokes/deletes a public share can contain data that no longer exists in the live database. Restoring that backup directly into public service can therefore resurrect data the user already removed.

PCS treats this as a release-blocking privacy property, not only a disaster-recovery concern.

## CI logical restore rehearsal

`tests/infrastructure/backup-restore-rehearsal.integration.mjs`:

1. creates a private custom-format `pg_dump` of the synthetic CI database;
2. restores it to a separate isolated database;
3. compares row counts for every application table;
4. compares non-internal trigger counts;
5. rechecks published-model immutability on the restored DB;
6. deletes the temporary dump instead of uploading it.

This verifies that repository migrations/data/triggers are logically restorable. It does not establish provider backup encryption, retention, access control, RPO/RTO or production operational readiness.

## Production restore quarantine

A production-equivalent restore MUST NOT receive public traffic until:

- provider restore completes into an isolated environment;
- exact application/model/content versions are resolved;
- retention cleanup is applied/reviewed;
- every deletion that happened after the backup timestamp is replayed from an independently durable deletion journal or equivalent mechanism;
- public-share tokens deleted/revoked after the backup are proven not to become active again;
- health/security/smoke checks pass;
- release owner records the restore evidence.

## Current blocker: independently durable deletion replay

PCS currently has user-controlled physical deletion and live-database retention tooling, but it does **not** yet have an independently durable deletion journal outside the backup failure domain.

Therefore `production_restore_privacy_safe=false` is mandatory and backup/restore remains an open release/manual control.

## Production evidence to capture

- provider backup encryption + configured retention;
- backup/control-plane access policy;
- production-equivalent restore rehearsal;
- independent deletion journal/equivalent;
- deletion replay evidence;
- post-restore retention cleanup;
- public-share non-resurrection proof.
