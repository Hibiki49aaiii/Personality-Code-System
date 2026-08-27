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

## Illustration brief evidence

- `data/illustration/v0.1-dev/brief-system.json`;
- `scripts/materialize-illustration-briefs.mjs`;
- `scripts/validate-illustration-briefs.mjs`;
- `docs/model/ILLUSTRATION_BRIEF_SPEC_v0.1-dev.md`.

Every development type now has a deterministic production brief, but every master/variant path remains null and every review gate remains open.

## Content QA

Before a Core Type is publishable:

- [ ] all mandatory content fields exist;
- [ ] claims trace to traits/interactions;
- [ ] no internal contradiction remains;
- [ ] adversarial wording is direct but not abusive;
- [ ] Japanese proofreading complete;
- [ ] illustration approved and correctly mapped;
- [ ] share-card crop verified;
- [ ] content/version metadata present.
