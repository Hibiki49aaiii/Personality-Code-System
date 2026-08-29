# Issue #33 Implementation Plan — Privacy-Preserving Retest Linkage Foundation

## Human Understanding Summary

Wave JA-01 plans test-retest stability analysis, but the repository deliberately has no retest linkage because the current calibration export schema excludes linkage and collection remains disabled.

This change must create only the **engineering foundation** needed to link a future baseline calibration record to one future retest calibration record. It must not identify a person, reuse the private assessment bearer, collect contact information, or activate calibration collection/export.

The human mental model is:

1. a baseline calibration record exists under explicit calibration consent;
2. the system may later issue a separate random one-time retest credential;
3. the raw retest credential is shown/held outside the database; only its SHA-256 hash is persisted;
4. a random `retestPairId` identifies the research pair, not the person;
5. when a retest record is eventually claimed, it must be a different calibration record, same frozen Wave/model, and within 14–21 days;
6. a withdrawal/deletion affecting either member makes the pair unusable and journals both pseudonymous record IDs for future artifact purge;
7. no runtime route/materializer is added in this Issue.

## Source of Truth

1. Issue #33
2. `data/calibration/beta-wave-ja-01-draft.json`
3. `data/calibration/beta-wave-ja-01-scope-freeze-v0.1-dev.json`
4. `data/calibration/governance-policy-v0.1-dev.json`
5. migrations 0008–0010
6. existing privacy/runtime-role contracts

Base main SHA: `8cf37658be8d96a4e32844fbb202d7f2735b5b0d`.

## Architecture Decision

### A — direct identity/contact linkage

Reject. Email/account/contact data expands the privacy and legal surface and is not required for psychometric pairing.

### B — reuse anonymous assessment bearer

Reject. A diagnostic capability token must never become a research linkage identifier or exportable value.

### C — dedicated pair UUID + one-time token hash

Adopt.

- `retest_pair_id`: random UUID, analysis linkage only.
- raw claim credential: 32 random bytes/base64url.
- DB stores only SHA-256 hash.
- baseline/retest calibration record IDs remain pseudonymous UUIDs already separated from session capabilities.
- runtime role remains denied.

## Persistence Design

Add `calibration_retest_linkages`:

- `retest_pair_id uuid PK default gen_random_uuid()`
- `baseline_calibration_record_id uuid NOT NULL` → `calibration_record_links(calibration_record_id) ON DELETE CASCADE`
- `retest_calibration_record_id uuid NULL` → same table ON DELETE CASCADE
- `claim_token_hash char(64) NOT NULL UNIQUE`
- exact frozen scope fields:
  - wave_id
  - assessment_model_version
  - item_bank_version
  - scoring_version
  - trait_dictionary_version
  - locale
- `eligible_from timestamptz NOT NULL`
- `eligible_until timestamptz NOT NULL`
- `status issued|claimed`
- `issued_at`
- `claimed_at NULL`

Constraints/trigger rules:
- baseline unique;
- claimed retest unique;
- baseline != retest;
- eligible_from < eligible_until;
- exact current Wave JA-01 scope;
- eligible interval is exactly 14–21 days from baseline session completion;
- baseline record must resolve through consent receipt to a completed session with granted consent;
- claim requires retest record to resolve through granted consent/completed session under exact same model/locale;
- retest completion time must fall within eligible window;
- identity/scope/token/window immutable;
- issued → claimed is the only update;
- direct deletion allowed only when one of the linked calibration_record_links has already disappeared via owner-consent deletion, so privacy cascade can remove linkage.

Deletion propagation:
- before a linked record disappears, journal both baseline and claimed retest IDs using bounded reasons;
- pair table then cascades away with the record-link FK.
- deletion journal remains append-only.

## Candidate Retest Export Schema

Do not mutate v0.1.

Create `calibration-export-record-v0.2-retest-dev` candidate:
- all v0.1 fields;
- `measurementOccasion`: baseline | retest
- `retestPairId`: UUID

No raw claim token/hash, session ID/token, operator ID/token, contact, IP/location, demographics, result prose, derived scores/codes.

The v0.2 candidate remains runtime/materializer disabled.

## Consent Contract

Create separate draft-only retest consent identity:
- legal_approved=false
- collection_authorized=false
- export_authorized=false
- optional purpose-specific pairing
- no direct identity/contact requirement
- explicit pair-level withdrawal/purge obligation
- separate approval required before activation

## Credential Primitive

Add a small infrastructure helper:
- 32 random bytes
- base64url canonical length 43
- SHA-256 hash
- format validation
- constant-time match helper
- domain separation in naming/policy; no token prefix added unless needed

No raw token storage API.

## Security / Privacy

- add table to privacy inventory
- add to runtime no-access list and empty privileges
- no runtime grant template changes that add access
- no calibration API route
- threat model: prevent session-bearer reuse, token leakage, pair identity inference
- purge/deletion journal remains bounded

## Tests

### Unit
- token format/hash/known behavior
- candidate v0.2 strict allowlist
- unknown field/raw capability rejection
- baseline/retest measurement occasion validation
- mixed pair/scope manifest rejection

### PostgreSQL
- valid baseline linkage insert
- exact 14–21 day window required
- wrong scope rejected
- ungranted/incomplete baseline rejected
- valid claim
- outside-window claim rejected
- same-record claim rejected
- duplicate baseline/retest rejected
- second mutation rejected
- raw token cannot be stored by format constraints
- withdrawal/session deletion removes active pair and journals both linked record IDs
- runtime role zero access

## Files Expected

- `drizzle/0011_calibration_retest_linkage.sql`
- `src/infrastructure/persistence/calibrationSchema.ts`
- `src/infrastructure/persistence/calibrationRetestCredential.ts`
- `src/domain/calibration/retestExportRecord.ts`
- `data/calibration/retest-linkage-policy-v0.1-dev.json`
- `data/calibration/retest-consent-purpose-v0.1-dev.json`
- `data/calibration/export-schema-v0.2-retest-dev.json`
- validators/tests/docs/policies/traceability

## Pre-Implementation Review

### Requirements
Pass. The selected scope closes the repository-side linkage/schema foundation without claiming external consent/legal/preregistration completion.

### Architecture
Pass with conditions:
- v0.1 export schema must remain byte/semantic compatible;
- no session/private bearer value may enter linkage/export;
- DB invariants must independently enforce current Wave scope and timing;
- privacy cascade must not leave an active pair after consent/session deletion.

### Risk
Pass with explicit fail-closed behavior:
- no runtime API;
- no runtime DB privileges;
- all activation flags remain false;
- retest consent stays draft/unapproved;
- actual retest collection remains blocked.

## Implementation Checklist

- [x] Human Understanding Summary
- [x] Architecture Options
- [x] Pre-Implementation Review
- [ ] policy contracts
- [ ] migration 0011
- [ ] Drizzle schema
- [ ] credential primitive
- [ ] candidate retest export schema/domain
- [ ] deletion propagation
- [ ] privacy/runtime role updates
- [ ] validators/unit tests
- [ ] PostgreSQL integration
- [ ] docs/requirements/traceability
- [ ] full CI/CodeQL/build/E2E
- [ ] Post-Implementation Review
