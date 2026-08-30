# Issue #34 — Implementation Plan

## Goal

Add a fail-closed, answer-level calibration storage foundation for Wave JA-01 without enabling runtime collection or raw export.

## Base

- Main SHA: `8cf37658be8d96a4e32844fbb202d7f2735b5b0d`
- CI #787: success
- CodeQL #120: success
- Container Package #56: success

## Human Understanding

The repository already separates diagnostic data, calibration consent, operator control and deletion journals, but it has no dedicated answer-level calibration dataset. Reusing `assessment_answers` would collapse diagnostic and research purposes. The new storage must therefore remain purpose-separated and inaccessible to the ordinary runtime until a later activation issue explicitly introduces an ingest path.

## Architecture

Selected option: normalized calibration record + item response tables under existing pseudonymous `calibration_record_links`.

### Parent
`calibration_record_links.calibration_record_id`

### Record table
`calibration_records`
- one row per pseudonymous calibration record;
- exact Wave/model/item/scoring/Trait/locale identity;
- draft → complete lifecycle;
- no participant/session/token/result fields.

### Response table
`calibration_item_responses`
- normalized item rows;
- FK to model item revision;
- value 1..5;
- one response per item per calibration record.

## Database rules

1. Record insert requires:
   - linked consent receipt exists and is granted;
   - consent purpose/version/locale/model match Wave JA-01;
   - exact frozen Wave JA-01 tuple.

2. Response insert requires:
   - parent record is still draft;
   - item belongs to the exact assessment model;
   - item revision/locale match `assessment_model_items`;
   - value 1..5.

3. Finalize function:
   - record is draft;
   - consent still granted;
   - exact model release tuple still matches;
   - response count equals required model item count;
   - no required item missing;
   - no off-model/mismatched response;
   - sets status complete + completed_at.

4. Mutability / privacy deletion:
   - record scope cannot change;
   - complete record cannot change;
   - response rows cannot update;
   - response rows cannot be directly deleted;
   - owner-session deletion through parent `calibration_record_links` cascades record and responses;
   - a future controlled purge may delete a `calibration_records` row only after an append-only privacy deletion event exists; no role/executor receives that capability in this Issue.

## Security boundary

No new DB role is created.

These roles must remain zero-access to the new tables:
- pcs_runtime
- pcs_calibration_auth
- pcs_calibration_admin
- pcs_calibration_export_control

`pcs_finalize_calibration_record(uuid)` is revoked from PUBLIC and not granted to any application/operator role in this issue.

## Data minimization

Permitted:
- pseudonymous calibrationRecordId
- exact wave/version scope
- item ID/revision/locale
- Likert 1..5
- lifecycle timestamps/status

Forbidden:
- session ID
- diagnostic bearer/token/hash
- public share token/hash
- IP/location
- email/name
- free text
- trait scores
- response-quality classification
- Core/Extended Code
- result prose/snapshot
- ordinary analytics linkage

## Migration

`drizzle/0011_calibration_answer_storage.sql`

Update:
- `src/infrastructure/persistence/calibrationSchema.ts`
- migration-order assertions
- persistence validator
- calibration protocol/governance machine status
- traceability/change ledger/threat model

## Tests

### PostgreSQL answer-storage integration
- exact valid record finalizes;
- incomplete record finalize rejected;
- wrong scope rejected;
- wrong model item/revision/locale rejected;
- invalid value rejected;
- duplicate item rejected;
- answer update rejected;
- direct answer delete rejected;
- completed record mutation rejected;
- parent link deletion cascades storage;
- withdrawal immediately blocks further draft-response inserts;
- a deletion-journal event makes record-level purge structurally possible for a future controlled executor while no executor is granted here;
- existing deletion journal remains inspectable.

### Privilege regression
Every ordinary/operator role gets zero direct privileges on both new tables and no EXECUTE on finalize.

## State transition

May advance:
- `answer_level_calibration_storage_schema_implemented=true`

Must remain false:
- runtime calibration collection
- calibration ingest role/surface
- raw export materializer
- targeted purge executor
- retest linkage
- production operator provisioning
- external preregistration/legal/environment gates

## Rollback

No production data exists. Migration is additive. Before activation, rollback is safe by reverting the branch/PR; after migration deployment, forward-fix is preferred.

## Verification

Full CI + PostgreSQL integrations + typecheck + production build + Chromium E2E + CodeQL + release evidence.
