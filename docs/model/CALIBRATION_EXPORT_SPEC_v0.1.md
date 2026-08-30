# Calibration Export Specification v0.1

> Status: design + strict offline schema foundation; runtime export is intentionally disabled until consent/legal and beta-governance prerequisites exist.
> Date: 2026-08-27

## Separation from product analytics

Psychometric calibration is not product analytics.

`product_events` MUST NOT be treated as the calibration dataset, and the calibration path MUST NOT infer answer values from UI events.

Calibration may require answer-level data because item/scale quality cannot be estimated from click counts alone. That higher-sensitivity use requires a separate lawful/consented data path.

## Activation prerequisites

No calibration export may execute until all of these exist:

1. explicit calibration participation/consent state stored separately from ordinary assessment completion;
2. a versioned consent text/purpose identifier;
3. documented retention/deletion behavior;
4. export schema and field allowlist;
5. operator authorization/audit mechanism;
6. production environment separation;
7. legal/privacy approval appropriate to the launch jurisdiction;
8. minimum-data justification for every exported field.

Until then, the correct runtime behavior is: **no calibration export endpoint/job exists**.

Consent receipt infrastructure now exists separately from answer-level research data, and a machine-validated engineering governance policy plus operator-plane persistence foundation now define candidate retention/deletion, role, request, audit and deletion-journal rules. This still does not satisfy activation by itself. The ordinary runtime role is intentionally denied all access to every calibration consent/operator-plane table, the consent copy remains draft/not legally approved, offline operator authentication and request/review/approve/reject control are implemented, but production operator provisioning and raw materialization/purge tooling are not implemented. Purpose-separated `calibration_records` / `calibration_item_responses` tables now exist as a zero-runtime-access schema foundation, but no runtime ingest path, collected calibration rows or export materializer exists.

## Current offline schema foundation

`data/calibration/export-schema-v0.1-dev.json` and `src/domain/calibration/exportRecord.ts` now freeze the **minimum allowed record shape** before any runtime export exists.

v0.1 permits only:

- random `calibrationRecordId` unrelated to session/share capabilities;
- one exact wave / consent / purpose / model / item-bank / scoring / Trait Dictionary / locale scope;
- item ID + revision + 1–5 response values.

The pure-domain validator rejects unknown fields instead of silently dropping them. A manifest builder also rejects records from mixed model/version/wave scopes.

v0.1 deliberately excludes retest linkage, demographics, timing, derived Trait Scores/codes, result prose, session/public capabilities, IP/location, product analytics and logs. Retest therefore uses a separate candidate-only `calibration-export-record-v0.2-retest-dev` contract that adds only measurement occasion + random pseudonymous `retestPairId`; v0.1 itself is unchanged. Candidate-schema existence does not authorize materialization.

This schema is **not** an export job, endpoint, authorization, or dataset.

## Candidate export fields after activation

A future version MAY include only consented records and fields such as:

- random calibration record ID unrelated to bearer/public tokens;
- exact assessment model/item/revision versions;
- item response values needed for psychometric analysis;
- response timing buckets when specifically justified;
- completion/retest linkage via a dedicated rotating pseudonymous identifier;
- optional demographic fields only when separately consented and required for measurement-invariance analysis.

## Forbidden export fields

- private session bearer token or token hash;
- public share token/hash;
- IP address or precise location;
- email/account identity unless a separately documented research protocol requires it;
- result prose;
- operational logs;
- unrelated product analytics history;
- free-form fields.

## Retest linkage

If retest reliability is studied, linkage uses a purpose-specific pseudonymous identifier. The repository foundation now pairs completed `calibration_records` using random `retestPairId` plus an independent one-time claim credential stored only as SHA-256. It never exports the claim token/hash or assessment session capability. Either linked withdrawal invalidates the pair and journals both pseudonymous record IDs for future purge. Runtime issuance/claim remains disabled.

## Output and audit

A future export job must comply with `CALIBRATION_GOVERNANCE_POLICY_v0.1.md` and:

- require an explicit scope (model version, locale, date range, consent version);
- require a requester plus a **different** approver before raw materialization;
- write a manifest containing row count and schema version;
- write a bounded operator audit record with the exact wave/version scope and artifact SHA-256;
- never place raw responses, session capabilities, participant identity/contact/location or free-form participant data in the operator audit record;
- fail closed if unapproved fields appear;
- never upload automatically to a third party;
- support targeted deletion plus artifact purge/re-generation when consent is withdrawn where legally/technically required;
- enforce the engineering 180-day row-level artifact ceiling unless a later reviewed policy version changes it.

Append-only operator audit storage, pseudonymous targeted-deletion linkage/journal, and an execute-only offline request/review/approve/reject workflow are implemented at the repository persistence layer. Raw export remains blocked because production operator provisioning, raw materialization/artifact handling and offline purge/regeneration tooling are intentionally absent.

## Current decision

PCS deliberately leaves `PCS-ANA-003` open. A strict offline allowlist/manifest contract now exists so a future consented export cannot invent its data shape ad hoc, but no database-to-export materializer, runtime endpoint/job, production operator provisioning evidence, offline purge executor, or activated answer-ingest/materialization path exists.

The companion `BETA_CALIBRATION_PROTOCOL_v0.1.md` now freezes the pre-collection analysis/governance contract while keeping both collection and export disabled. This means Phase 5 planning can progress without weakening the privacy boundary.
