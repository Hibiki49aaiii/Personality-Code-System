# reviewed item bank v0.2

This directory is a versioned review layer over `../v0.1` rather than a destructive copy.

Canonical materialization:

1. load every immutable item from `item-bank-v0.1` in manifest order;
2. load `review.json`;
3. require every base item to appear exactly once as `accept-r1`, `revise-r2`, or `hold-for-beta`;
4. apply only the approved r2 text/revision changes;
5. mark the materialized candidate lifecycle as `reviewed`;
6. preserve ID, primary trait, key direction, weight, order, and response scale.

The CI validator and `materializeReviewedItemBank()` enforce these invariants.

`reviewed` means the complete editorial/construct-purity pass is recorded. It does **not** mean beta-calibrated, statistically validated, or production-active.
