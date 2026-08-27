# TYPE_EDITORIAL_REVIEW_WORKLIST_v0.1-dev

> Status: Phase 3A review-operations tooling
> Public use: **false**
> Source schema: `core-code-v0.1-dev` / C01D

## Purpose

Turn the already-materialized 64-type draft catalog into a deterministic human-review queue without duplicating or hand-copying the prose under review.

`scripts/materialize-type-editorial-review-worklist.mjs` joins, for every reachable Core Code:

- draft display name and formal title;
- six Core-axis symbols / Trait anchors;
- all nine long-form editorial text fields;
- field-level claim provenance;
- all six one-axis neighbor comparisons;
- the exact human-review ledger state;
- an eight-point reviewer checklist.

The generated worklist is an **inspection artifact**, not a source of truth and not a publication action.

## Usage

`npm run generate:type-editorial-review-worklist`

Default output:

`artifacts/editorial-review/type-review-worklist.ja.json`

An alternate path may be supplied directly to the Node script with `--output=<path>`.

## Review-state rule

The tool copies review status from `editorial-review-ledger.ja.json`. It MUST NOT infer, auto-approve or synthesize a reviewer, timestamp, issue resolution or final approval.

The validator checks exactly 64 packets, all expected text/provenance/neighbor fields and canonical review order.

## Publication boundary

Even if every human review entry is later approved, this worklist does not make C01D public. The separate fail-closed publication gate still requires a public-use schema/catalog decision, illustration approval and Phase 5C model freeze.
