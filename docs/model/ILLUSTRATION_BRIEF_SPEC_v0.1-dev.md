# ILLUSTRATION_BRIEF_SPEC_v0.1-dev

> Status: Phase 3B production-brief foundation
> Public use: **false**
> Runtime generation: **false**

## Purpose

Turn the existing 64 illustration slots into reviewable production briefs without pretending that any hero asset has been produced or approved.

The brief layer binds each C01D slot to:

- the development type display name;
- exact role/action/relationship motif keys;
- the shared PCS illustration style;
- required result/OG/share crop constraints;
- prohibited visual tropes;
- a non-diagnostic representation rotation;
- an explicit review checklist;
- null source/master/variant paths until real assets exist.

## Representation rule

Character representation is **not diagnostic data**.

The current eight representation variants rotate by canonical catalog index only and are evenly distributed across the 64 slots. They MUST NOT be inferred from Core Code, Trait scores, gender, ethnicity, age, disability, attractiveness, occupation, or social status.

This creates diversity planning without teaching users that a psychological code maps to a demographic body.

## Production boundary

A brief-ready slot still has:

- `master_path = null`;
- every required web variant = `null`;
- `source_provenance = null`;
- every review check = `false`;
- status `brief-ready-asset-unproduced`.

Therefore this work does not complete PCS-ART-002.

## Review transition

A real asset may only leave the unproduced state after all review checks have inspectable evidence:

1. motif mapping;
2. style consistency;
3. anatomy/geometry;
4. no prestige hierarchy;
5. no diagnostic stereotype;
6. result crop;
7. OG crop;
8. portrait-share crop;
9. license/source provenance.

## Automated evidence

`scripts/validate-illustration-briefs.mjs` materializes all 64 briefs and verifies exact slot order, asset IDs, motif/crop contracts, balanced representation rotation, null production paths, open review gates, and runtime-generation prohibition.
