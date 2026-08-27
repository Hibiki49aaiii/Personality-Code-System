# TYPE_EDITORIAL_REVIEW_GATE_v0.1-dev

> Status: Phase 3A human-review foundation
> Locale: ja-JP
> Public catalog ready: **false**

## Purpose

Separate deterministic draft completeness from actual human editorial approval.

The repository already materializes 64 complete C01D draft entries. That does not mean the names, claims, adversarial wording, Japanese prose, or public taxonomy are approved.

## Per-type review dimensions

Every reachable code must be reviewed for:

1. naming-system consistency;
2. claim provenance;
3. one-axis neighbor differentiation;
4. non-clinical / non-deterministic language;
5. adversarial tone;
6. relationship/work/stress limitation wording;
7. Japanese proofreading;
8. final editorial approval.

The machine-readable ledger explicitly contains all 64 reachable codes and begins with every dimension set to `pending`.

## Publication boundary

Human editorial approval is necessary but not sufficient for public promotion.

The publication gate also requires:

- a code schema with `public_use=true`;
- the editorial catalog itself promoted to public use;
- no open editorial issues;
- approved illustration mapping;
- Phase 5C production public-model freeze.

Therefore C01D can be fully reviewed internally without being misrepresented as a validated/public taxonomy.

## Change control

A review entry may only become approved when reviewer identity, review date and issue resolution evidence are recorded. A content/catalog revision after approval requires re-review of affected dimensions rather than silently inheriting approval.

## Automated evidence

`scripts/validate-type-editorial-review-gate.mjs` checks:

- exact 64-code ledger coverage/order;
- exact review dimensions;
- valid review states;
- reviewer/date evidence for approved entries;
- code/catalog public-use consistency;
- fail-closed publication state while C01D remains non-public;
- publication gate blockers match actual repository state.
