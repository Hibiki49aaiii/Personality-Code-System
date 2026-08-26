# TYPE_CATALOG_SPEC_v0.1-dev

> Status: development engineering contract
> Catalog version: `type-catalog-v0.1-dev`
> Code schema: `core-code-v0.1-dev` / `C01D`
> Locale: `ja-JP`
> Public use: **false**

## Purpose

Define a deterministic, reviewable foundation for the future PCS Core Type catalog without pretending that the current experimental C01D schema is already the final public taxonomy.

The current code schema has six binary positions, therefore exactly `2^6 = 64` reachable Core Codes. This fact is an engineering reachability property, not evidence that human personality naturally consists of 64 discrete species.

## Source of truth

- `data/code-schema/v0.1-dev.json` defines the six axis positions, symbols, source Traits and thresholds.
- `data/type-catalog/v0.1-dev/reachability.json` freezes the exact 64 reachable C01D codes in canonical enumeration order.
- `scripts/validate-type-catalog.mjs` recomputes the reachable set from the code schema and rejects omissions, duplicates, impossible codes, schema drift or accidental public promotion.

## Current publication state

`C01D` is `public_use=false`. Therefore every Phase 3A artifact derived from C01D is a **draft engineering artifact**.

It MAY be used for:

- completeness engineering;
- editorial drafting;
- type-name exploration;
- adjacent-type differentiation review;
- illustration concept planning;
- deterministic UI integration tests.

It MUST NOT be used to claim:

- a finalized public PCS type taxonomy;
- validated 64-type psychology;
- population rarity for any code;
- scientific superiority to existing personality systems.

Promotion to a public catalog requires a later `public_use=true` code schema decision under the Phase 5C evidence gate.

## Reachability contract

A valid catalog for a six-axis schema must contain every possible legal symbol combination exactly once.

For C01D:

1. SYS — `S/L`
2. VER — `V/T`
3. AUT — `A/G`
4. EXE — `E/P`
5. NOV — `N/F`
6. RDP — `D/B`

Examples:

- all low-side anchors: `LTGPFB`;
- all high-side anchors: `SVAEND`;
- any one-axis change produces a one-axis neighbor.

Each Core Code has exactly six one-axis neighbors under C01D. Neighbor relationships are computed from schema positions rather than manually authored.

## Stable type identity

While C01D remains the active development schema, the stable development type ID is:

`C01D-<CORE_CODE>`

Examples:

- `C01D-LTGPFB`
- `C01D-SVAEND`

A future public schema MUST use its own schema token/type IDs rather than silently reinterpreting C01D IDs.

## Editorial entry contract

When an individual draft type is authored, the entry must eventually contain:

- stable type ID;
- Core Code;
- locale;
- editorial status;
- public type name;
- short identity sentence;
- concise overview;
- strengths;
- adversarial/failure modes;
- relationship/love profile;
- work profile;
- stress profile;
- growth guidance;
- personal-manual summary;
- claim provenance;
- one-axis differentiation notes;
- illustration status/reference;
- exact content/catalog version.

Until those fields pass editorial QA, the entry remains `draft`/`unwritten` and cannot be promoted to public content.

## Claim provenance

Core Type prose cannot be free association around a six-letter code. Every material psychological claim must trace to structured evidence available in the deterministic result model.

Allowed provenance sources:

- `trait:<TRAIT_ID>:<band-or-pole>`;
- `interaction:<INTERACTION_ID>`;
- `core-axis:<position>:<symbol>`;
- `limitation:<rule-id>`;
- `product-guidance:<rule-id>` for neutral non-diagnostic advice.

A Core Type overview may integrate multiple sources, but the provenance record must make clear which measurements justify the claim.

## Six-axis compression rule

The Core Code is a memorable identity compression, not the complete diagnosis.

Long-form content MUST continue to use:

- all 21 canonical Trait scores;
- active interaction rules;
- response-quality metadata where appropriate;
- deterministic content precedence/suppression.

A type entry MUST NOT overwrite or contradict a user's more specific 21-Trait/interaction result merely because the two users share the same six-letter Core Code.

## Adjacent-type differentiation

For every authored type, editorial review must compare all six one-axis neighbors.

Differentiation text should answer:

- which one measured anchor changed;
- what interpretation is supported by that changed anchor;
- what must remain unchanged because the other five Core anchors are identical;
- which non-Core Traits can still make two same-code users meaningfully different.

This prevents type descriptions from becoming unrelated stereotypes.

## Draft naming rules

Public-facing names should:

- be memorable in Japanese;
- avoid moral ranking such as “superior”, “elite”, “weak”, or “genius”;
- avoid medical/clinical labels;
- avoid mystical destiny framing;
- remain distinguishable from one-axis neighbors;
- not imply more precision than the measurement supports;
- feel like one coherent authored naming system across all types.

Names are presentation metadata. Changing a name alone does not change scoring semantics, but it does require an explicit content/catalog revision.

## Illustration linkage

Illustration planning may begin against development IDs, but final published asset mapping requires:

- approved art direction;
- one curated hero asset or approved fallback per published type;
- stable asset/version ID;
- result/OG/portrait crop strategy;
- no runtime image generation.

If the public code schema changes, C01D draft illustrations are not silently remapped. They must be explicitly reviewed for reuse or retirement.

## Validation gate

`npm run validate:type-catalog` must fail if:

- code schema version/token do not match;
- either schema or catalog is accidentally marked public at this development stage;
- reachable count is not exactly 64;
- a legal code is missing;
- a code is duplicated;
- an impossible code is present;
- canonical code order drifts without a catalog version change.

## Phase 3A completion boundary

This development reachability foundation is **not** completion of Master `PCS-CONTENT-001`.

Master content completion still requires:

1. a code schema approved for public use;
2. complete versioned entries for every reachable public code;
3. required result-domain editorial coverage;
4. adversarial-language QA;
5. final Japanese editorial QA;
6. curated illustration mapping under the Phase 3B asset gate.
