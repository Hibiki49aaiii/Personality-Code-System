# 05 — Type Content and Illustration Requirements

## Master-ID reservation

`REQUIREMENTS.md` owns the top-level meanings of **PCS-CONTENT-001..003** and **PCS-ART-001..003**. This derivative file MUST NOT redefine them. Detailed editorial clauses use **PCS-CONTENT-010+** and detailed asset-production clauses use **PCS-ART-010+**.

## Content system

PCS content is an authored product asset, not runtime generative output.

Every published Core Type MUST have a versioned catalog entry containing:

- Core Type code;
- public type name;
- short identity sentence;
- concise overview;
- strengths;
- adversarial/failure modes;
- relationship/love profile;
- work profile;
- stress profile;
- growth guidance;
- illustration reference;
- content version/status.

A development catalog MAY exist before a schema is approved for public use, but it must remain explicitly `draft`/`public_use=false` and MUST NOT be presented as the final public taxonomy.

## Editorial requirements

- **PCS-CONTENT-010** Copy MUST match the diagnostic claims allowed by the measured traits/interactions.
- **PCS-CONTENT-011** Copy MUST not imply clinical diagnosis.
- **PCS-CONTENT-012** Copy MUST avoid universal statements where the underlying measurement is continuous/probabilistic.
- **PCS-CONTENT-013** Positive and adversarial interpretations MUST be derived from the same model rather than unrelated flattering/negative stereotypes.
- **PCS-CONTENT-014** Similar types SHOULD be explicitly differentiated so users can understand why their code differs.
- **PCS-CONTENT-015** Public-facing Japanese terminology MUST remain consistent across questions, results, help pages, and social cards.

### Claim provenance

Each authored type claim SHOULD be traceable to one or more of:

- Core anchor trait/pole;
- non-Core Trait band;
- approved interaction rule;
- response-quality/measurement limitation rule;
- neutral product guidance.

A type-level sentence that cannot be traced to structured diagnostic evidence is editorially unsupported and cannot be promoted to published content.

## Localization

Japanese is the initial authoritative public locale unless scope is changed.

When additional locales are added:

- translations are versioned content assets;
- item translations require measurement review, not literal translation only;
- a locale change MUST NOT change scoring semantics intentionally;
- type code remains stable across locales;
- type names may be localized but must map to the same Core Type ID.

## Illustration role

Illustrations are a primary identity/recognition layer. They MUST support quick recognition at result-page and social-card size while remaining subordinate to diagnostic information.

## Art direction requirements

Before producing the full catalog, an art-direction specification MUST define:

- character/body style;
- line/shape language;
- palette system;
- background treatment;
- texture/material treatment;
- facial expression range;
- props/symbol vocabulary;
- composition rules;
- accessibility/contrast constraints;
- social-card crop safe zones;
- prohibited visual tropes.

The visual family SHOULD feel authored and collectible, not like unrelated prompt-generated images.

## Asset production

Current Phase 3B preparation additionally materializes 64 production briefs from the illustration slot grammar. The briefs freeze motif, style, crop, prohibited-trope, non-diagnostic representation, and review-check requirements while keeping every actual asset path/status unproduced. This is preparation evidence only and does not satisfy the hero-asset requirement.

- **PCS-ART-010** One approved hero illustration per published Core Type.
- **PCS-ART-011** Source/master asset retained outside runtime optimization pipeline where practical.
- **PCS-ART-012** Web-optimized variants generated deterministically from approved masters.
- **PCS-ART-013** Asset filenames/IDs use stable type/asset version references.
- **PCS-ART-014** Runtime generation is prohibited.
- **PCS-ART-015** If generative tools are used during development, outputs must be human-reviewed, licensed/usable, curated, committed/versioned like any normal design asset, and no model/API is needed by production.

## Secondary trait modifiers

Modifiers MAY be introduced only if:

- the modifier has a deterministic mapping from structured result data;
- visual changes are curated/reproducible;
- the number of combinations is operationally manageable;
- modifiers do not make users infer unsupported psychological meaning from decorative elements.

For v1, a single hero illustration per Core Type is preferred over uncontrolled combinatorial variants.

## Social-card artwork

Each hero asset MUST have a defined crop/placement strategy for:

- landscape Open Graph card;
- portrait/mobile share card;
- result hero area.

Text MUST not be baked into the master character illustration if it prevents localization/accessibility.

## Current Phase 3A engineering gate

The current development Core schema `core-code-v0.1-dev` / `C01D` is explicitly `public_use=false`. Phase 3A now materializes and validates a complete **draft engineering/editorial catalog** for every reachable C01D code, including display-name drafts, all required type-level prose fields, field-level claim provenance, limitation-safe non-Core domains, and six one-axis neighbor differentiation records. Human approval/public names/final prose remain unapproved.

Promotion of any entry to `published` requires a later `public_use=true` schema decision plus final editorial and illustration QA. This prevents Phase 3 work from silently pre-empting the Phase 5C public-code evidence gate.

### Current draft-catalog evidence

- `data/type-catalog/v0.1-dev/editorial-catalog-manifest.ja.json` freezes the draft composition/limitation rules;
- `scripts/materialize-type-editorial-catalog.mjs` deterministically materializes all 64 development entries;
- `scripts/validate-type-editorial-catalog.mjs` verifies required fields, prohibited claims, field provenance, non-Core limitation wording, six-neighbor differentiation, and illustration-unassigned state;
- `docs/model/TYPE_EDITORIAL_CATALOG_SPEC_v0.1-dev.md` defines the publication boundary.

This is development editorial completeness evidence, not human editorial approval or public-schema approval.

### Human editorial approval ledger

Phase 3A now also has an explicit 64-type human review ledger and fail-closed publication gate:

- `data/type-catalog/v0.1-dev/editorial-review-ledger.ja.json`;
- `data/type-catalog/v0.1-dev/publication-gate.json`;
- `docs/model/TYPE_EDITORIAL_REVIEW_GATE_v0.1-dev.md`;
- `scripts/validate-type-editorial-review-gate.mjs`.

Every reachable C01D code is individually tracked across naming consistency, claim provenance, neighbor differentiation, non-clinical language, adversarial tone, non-Core limitation wording, Japanese proofreading, and final editorial approval. All entries begin `pending`.

The publication gate remains blocked unless the code schema and catalog are public, all review dimensions are approved, editorial issues are closed, illustration mapping is approved, and Phase 5C model freeze is complete.

### Human editorial review worklist

Review execution is now operationalized by a deterministic 64-type packet generator rather than requiring reviewers to manually join multiple source files:

- `scripts/materialize-type-editorial-review-worklist.mjs`;
- `scripts/validate-type-editorial-review-worklist.mjs`;
- `docs/model/TYPE_EDITORIAL_REVIEW_WORKLIST_v0.1-dev.md`;
- `npm run generate:type-editorial-review-worklist`.

Each packet includes the draft name/title, all six Core anchors, all nine editorial prose fields, claim provenance, six one-axis neighbor comparisons, exact ledger state and the eight-point reviewer checklist. The generator never auto-approves a type or invents reviewer evidence.

## Illustration brief evidence

- `data/illustration/v0.1-dev/brief-system.json`;
- `scripts/materialize-illustration-briefs.mjs`;
- `scripts/validate-illustration-briefs.mjs`;
- `docs/model/ILLUSTRATION_BRIEF_SPEC_v0.1-dev.md`.

Every development type now has a deterministic production brief, but every type-specific master/variant path remains null and every review gate remains open.

## Current curated fallback artwork

The current application also carries one repository-authored static fallback asset, `ILL-PCS-FALLBACK-HERO-v01`, defined by `data/illustration/v0.1-dev/fallback-asset.json` and `src/components/illustration/CuratedFallbackArtwork.tsx`.

It is explicitly:

- curated/versioned;
- `type_specific=false`;
- `public_use=false` while the public model/art catalog remains unapproved;
- rendered without runtime AI/image generation;
- frozen into new `result-snapshot-v0.2-dev` records;
- propagated unchanged into sanitized share snapshots;
- used on the private result, public share, OG card and portrait share card;
- protected by PostgreSQL asset-existence and source→share asset-lineage guards.

This completes the static/versioned runtime artwork requirement **PCS-ART-003** for the current application while deliberately leaving **PCS-ART-002** open. One generic fallback is not a substitute for 64 curated type-specific hero illustrations.

Full CI Run 432 validates the current persistence/domain/build/E2E chain; Visual Baseline Run 9 freezes the resulting result/share presentation.

## Content QA

Before a Core Type is publishable:

- [x] all mandatory draft content fields exist for every reachable C01D code; *(machine-validated development evidence)*
- [x] draft claims trace to allowed Core/limitation provenance; *(machine-validated development evidence)*
- [ ] no internal contradiction remains;
- [ ] adversarial wording is direct but not abusive;
- [ ] Japanese proofreading complete;
- [ ] illustration approved and correctly mapped;
- [ ] type-specific share-card crop verified; *(generic curated fallback result/OG/portrait rendering is already browser/visual-tested)*
- [x] development content/version metadata present; *(public published catalog/version approval remains PCS-CONTENT-001)*
