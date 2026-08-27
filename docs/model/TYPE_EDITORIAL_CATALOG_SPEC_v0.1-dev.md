# TYPE_EDITORIAL_CATALOG_SPEC_v0.1-dev

> Status: Phase 3A complete structural/editorial draft foundation
> Editorial catalog: `type-editorial-catalog-ja-v0.1-dev`
> Source catalog: `type-catalog-v0.1-dev`
> Code schema: `core-code-v0.1-dev` / `C01D`
> Public use: **false**

## Purpose

Materialize a complete 64-entry Japanese Core Type editorial draft from the already versioned C01D structural naming and editorial primitives, while preserving the rule that C01D is an experimental non-public engineering schema.

This artifact exists to expose missing-field, provenance, adjacent-type, and unsupported-claim problems before human editorial approval. It is not final public copy.

## Required draft fields

Every reachable C01D type materializes:

- stable type ID and Core Code;
- structural title;
- human-facing display-name draft;
- identity sentence;
- overview;
- strengths;
- adversarial/failure-mode copy;
- relationship/love profile;
- work profile;
- stress profile;
- growth guidance;
- personal-manual summary;
- field-level claim provenance;
- six one-axis differentiation records;
- illustration assignment status;
- source versions.

## Claim boundary

The six Core anchors are SYS, VER, AUT, EXE, NOV, and RDP. The draft catalog therefore MUST NOT invent type-level conclusions for non-Core dimensions.

Specific safeguards:

- relationship/love copy may use RDP, but explicitly defers BND/REC/CON/EMO/COG detail to the full Trait Vector;
- work copy may use the first five Core anchors, but explicitly defers FIN/PER/OPT/RSK detail;
- stress copy makes no Core-Type stress inference and explicitly defers to STR/UNC/RSK/EMO;
- growth guidance is conditional and cannot be framed as destiny, defect, or clinical diagnosis;
- Core Type never overrides 21-Trait or Interaction content.

## Provenance

Material claims use only:

- `core-axis:<position>:<symbol>`;
- `limitation:<rule-id>`.

The current draft deliberately does not claim a non-Core Trait band because a Core Code does not contain those scores.

## Adjacent-type differentiation

Every entry has exactly six one-axis neighbor notes derived from C01D positions. A note records:

- changed axis position;
- source Trait ID;
- source and neighbor symbols/labels;
- statement that the other five Core anchors remain identical.

The validator requires bidirectional neighbor records.

## Illustration boundary

Every current entry has:

- `illustration.status = "unassigned"`;
- `illustration.asset_id = null`.

This is deliberate. Editorial completeness does not pretend PCS-ART-002 is complete.

## Publication boundary

The materialized catalog remains `public_use=false` and `draft-machine-composed`.

It does **not** complete Master PCS-CONTENT-001 because publication still requires:

1. a `public_use=true` code schema decision after Phase 5 evidence;
2. human Japanese editorial review;
3. final adversarial-language review;
4. curated illustration mapping;
5. versioned published catalog release.

It substantially advances PCS-CONTENT-002/003 by making every required type-level draft field inspectable and machine-checked.

## Automated evidence

`scripts/validate-type-editorial-catalog.mjs` verifies all 64 entries, substantive field coverage, prohibited claim terms, limitation-safe relationship/work/stress copy, exact provenance shape, six one-axis neighbors, reverse-neighbor symmetry, and unassigned illustration state.
