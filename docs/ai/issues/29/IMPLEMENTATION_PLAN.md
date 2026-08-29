# Issue #29 — Implementation Plan

## Goal

Freeze Wave JA-01's repository candidate measurement scope before external preregistration, using both version identities and SHA-256 identities of explicitly enumerated canonical source files.

## Base

- Main SHA: 07d5f4920ef45e1913cd75ce35686c6d0b338294
- CI #777: success
- CodeQL #110: success
- Container Package #54: success

## Human Understanding

### What
Create a machine-readable, byte-identifiable snapshot of the exact assessment candidate that Wave JA-01 intends to preregister.

### Why
A version label such as item-bank-v0.2 is insufficient if repository bytes can change without a version bump.

### What this does not mean
- no external preregistration has occurred;
- no participant collection is authorized;
- no scientific validation is claimed;
- no production/public taxonomy is approved.

## Architecture

Selected design: explicit version tuple + ordered SHA-256 file identity set.

The whole Git commit is not the canonical freeze identity because unrelated operations/docs changes must remain possible without changing the measurement scope.

## Freeze Levels

### Measurement identity
- assessment-dev-v0.3
- item-bank-v0.2
- scoring-v0.1-dev
- trait-dictionary-v0.2
- ja-JP
- 147 items
- 21 direct Traits

### Release context
- core-code-v0.1-dev
- trait-interactions-v0.1
- content-dev-v0.3

### Frozen canonical files
1. data/release/assessment-dev-v0.3.json
2. data/item-bank/v0.1/manifest.json
3. data/item-bank/v0.1/cognitive.json
4. data/item-bank/v0.1/affect-relational.json
5. data/item-bank/v0.1/action-risk.json
6. data/item-bank/v0.1/resilience-creativity.json
7. data/item-bank/v0.2/manifest.json
8. data/item-bank/v0.2/review.json
9. docs/model/TRAIT_DICTIONARY_v0.2.md
10. docs/model/SCORING_SPEC_v0.1.md
11. src/domain/assessment/scoring.ts
12. data/interactions/v0.1.json
13. docs/model/TRAIT_INTERACTIONS_v0.1.md
14. src/domain/assessment/interactions.ts
15. data/code-schema/v0.1-dev.json

## Digest Contract

Each frozen entry stores:
- path
- bytes
- sha256

Aggregate digest input is exact UTF-8:
`path + NUL + sha256 + LF`
for entries in stored order.

The manifest stores the SHA-256 of the concatenated aggregate input.

## Validator Behavior

Fail if:
- tuple mismatches release/wave;
- any frozen file is missing;
- bytes or SHA-256 mismatch;
- duplicate/reordered file list;
- aggregate digest mismatch;
- item-bank v0.1 manifest file list is not fully covered;
- v0.2 materialization inputs are not covered;
- wave is marked preregistered;
- collection/export/start is enabled;
- code schema public_use becomes true under this development freeze.

## Amendment Rule

Any change to a frozen file requires a new scope-freeze manifest version or a new wave. If an external preregistration exists at that time, the change additionally requires a documented preregistration amendment/new-wave decision.

## Tests

- SHA-256 known vectors
- deterministic file identity
- aggregate digest determinism
- duplicate/reordered manifest rejection
- byte mutation rejection
- missing file rejection
- tuple drift rejection

## Source-of-Truth Updates

Update:
- Wave plan version_scope_frozen=true
- beta protocol exact candidate scope status to repository-frozen-not-preregistered
- consent blocker list
- requirements / traceability / preregistration draft
- change ledger

Do not alter:
- preregistration_document_ref=null
- sample plan preregistered=false
- collection_enabled=false
- export_enabled=false
- collection_start_allowed=false
- raw export materializer state
- production/public model gates

## Rollback

No runtime or database state changes. Revert the PR before external registration if the candidate needs to be changed.

## Verification

Full CI + CodeQL + build + 147-item Chromium E2E after freeze validator passes.
