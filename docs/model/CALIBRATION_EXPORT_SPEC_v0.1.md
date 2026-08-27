# Calibration Export Specification v0.1

> Status: design gate only; export is intentionally disabled until consent/legal and beta-governance prerequisites exist.
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

If retest reliability is studied, linkage must use a purpose-specific pseudonymous identifier. It must not expose the assessment session capability token and must be rotatable/deletable independently.

## Output and audit

A future export job must:

- require an explicit scope (model version, locale, date range, consent version);
- write a manifest containing row count and schema version;
- record who/what requested the export and when;
- fail closed if unapproved fields appear;
- never upload automatically to a third party;
- support deletion/re-generation when consent is withdrawn where legally/technically required.

## Current decision

PCS deliberately leaves `PCS-ANA-003` open. Building a raw-answer export before the consent/governance layer would contradict the privacy requirements rather than advance them.
