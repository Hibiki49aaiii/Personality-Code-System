# 14 — Phase 3B Illustration Delivery Requirements

Status: **foundation implemented / asset production pending**

This file refines the illustration requirements in `05_CONTENT_AND_ILLUSTRATION.md`. It does not replace the master meanings of `PCS-ART-001..003`.

## 1. Non-negotiable production rules

- **PCS-ART-020** Production runtime MUST NOT call an image-generation model/API.
- **PCS-ART-021** Every released illustration MUST resolve to a committed/versioned static asset ID.
- **PCS-ART-022** An illustration slot or prompt brief is NOT an approved illustration asset.
- **PCS-ART-023** A published Core Type MUST NOT resolve to an `unproduced`, missing, or mutable-latest asset.
- **PCS-ART-024** Type psychology MUST NOT determine protected/personal visual attributes such as gender, ethnicity, body type, attractiveness, disability, or age hierarchy.
- **PCS-ART-025** Art direction MUST NOT create a prestige hierarchy where some personality codes look inherently more intelligent, powerful, wealthy, heroic, or desirable.

## 2. Version identities

Development art-system version:

`illustration-system-v0.1-dev`

Development asset identity pattern:

`ILL-C01D-<CORE_CODE>-HERO-vNN`

Example:

`ILL-C01D-SVAEND-HERO-v01`

A changed approved master increments the asset version. Replacing bytes while retaining the same approved asset ID is prohibited.

## 3. Phase 3B-0 — Art-system foundation

### Completion criteria

- [x] visual objective and prohibited tropes documented in `docs/ILLUSTRATION_SYSTEM.md`;
- [x] role/action/relationship motif grammar defined;
- [x] runtime generation explicitly disabled;
- [x] stable asset-ID pattern defined;
- [x] required result/OG/share variants defined;
- [x] all 64 reachable C01D development types map to exactly one hero slot;
- [x] each slot maps back to the correct 3+2+1 Core component keys;
- [x] naming and illustration vocabularies are checked for drift;
- [x] CI validator rejects duplicate/missing/impossible slot mappings;
- [x] every current slot remains explicitly `unproduced` until actual artwork is reviewed.

Engineering foundation exit: **implemented**. This does not mean art direction is owner-approved or that any hero artwork exists.

## 4. Phase 3B-1 — Art direction approval

Before producing the 64-set at scale:

- [ ] one representative role from concrete (`L*`) family is drafted;
- [ ] one representative role from systems (`S*`) family is drafted;
- [ ] at least two action compositions are tested;
- [ ] both `広縁`/`深縁` relationship treatments are tested without extroversion stereotypes;
- [ ] the longest draft type names are tested adjacent to the artwork on mobile and OG layouts;
- [ ] palette tokens are proposed and contrast-reviewed;
- [ ] line/texture density is reviewed at result-card size;
- [ ] owner approves one art-direction reference sheet;
- [ ] approved reference sheet receives an immutable art-direction version.

No full 64-asset production batch should be treated as canonical before this gate.

## 5. Phase 3B-2 — Per-type hero production

For each Core Type slot, create one review record with:

- `core_code`;
- `asset_id`;
- master source/provenance;
- production method;
- license/usage basis where applicable;
- represented role/action/relationship motifs;
- master dimensions;
- approval status;
- reviewer/date;
- notes/deviations.

Allowed statuses:

- `unproduced`
- `draft`
- `review-required`
- `approved`
- `rejected`
- `superseded`

Only `approved` assets may be referenced by a production content/catalog release.

### Catalog completion

- [ ] 64/64 reachable development slots have draft masters if C01D remains the working production candidate;
- [ ] no duplicate hero master is reused as a different type merely by changing text;
- [ ] every asset has its intended motif mapping reviewed;
- [ ] no asset relies on a runtime-generation step.

If Phase 5C changes the public Core schema, development C01D masters may be reused only after an explicit migration/review decision.

## 6. Phase 3B-3 — Derived web variants

Each approved master requires:

- `result-portrait`;
- `og-landscape`;
- `share-portrait`.

Requirements:

- **PCS-ART-030** Derived variants MUST identify their source master asset/version.
- **PCS-ART-031** Cropping/resizing SHOULD be deterministic from the approved master where practical.
- **PCS-ART-032** No localized result text is baked into the master artwork.
- **PCS-ART-033** Critical subject/identity motif remains visible in every required crop.
- **PCS-ART-034** Web variants MUST use production-appropriate formats/dimensions and avoid unnecessary payload.

Completion:

- [ ] 64 approved result variants;
- [ ] 64 approved OG variants;
- [ ] 64 approved portrait-share variants;
- [ ] crop-safe-zone QA recorded;
- [ ] mobile and desktop visual checks recorded.

## 7. Phase 3B-4 — Visual QA

Every `approved` asset must pass:

- [ ] anatomy/geometry/manual artifact inspection;
- [ ] motif-to-type correctness;
- [ ] shared style consistency;
- [ ] no unsupported diagnostic symbolism;
- [ ] no prestige hierarchy;
- [ ] no accidental visual coding of protected/personal attributes to personality;
- [ ] result-page readability;
- [ ] OG readability;
- [ ] portrait-share readability;
- [ ] source/license provenance recorded;
- [ ] asset version immutable after approval.

## 8. Snapshot/catalog integration gate

Illustration linkage must be historical-result safe.

A result/share artifact MUST NOT resolve an illustration through a mutable “current image for SVAEND” lookup. The final implementation must bind either:

1. an exact asset ID/version into the immutable result/share snapshot; or
2. an immutable content/catalog version whose type entry resolves to one exact asset ID/version.

The chosen approach must have a regression test proving that publishing a newer asset version does not alter rendering of an older frozen result where historical representation is required.

## 9. Current state

Current repository state now includes both the **engineering slot/brief foundation** and a fail-closed **production ingest registry**:

- `data/illustration/v0.1-dev/system.json` defines the 64-slot grammar;
- `scripts/materialize-illustration-slots.mjs` and `materialize-illustration-briefs.mjs` generate the slot/brief contracts;
- `data/illustration/v0.1-dev/asset-ingest-contract.json` defines master/variant/provenance/approval requirements;
- `data/illustration/v0.1-dev/asset-production-registry.json` tracks all 64 exact asset IDs;
- `scripts/validate-illustration-asset-registry.mjs` rejects missing bytes, digest/path/dimension/provenance/review drift once an entry leaves `unproduced`;
- all 64 type-specific slots are still deliberately `unproduced`;
- current runtime continues to use only the separate versioned development fallback; no released web page depends on an image-generation runtime.

Therefore Phase 3B production mechanics are substantially prepared, but **PCS-ART-002 remains open until real curated hero assets exist and are reviewed**.
