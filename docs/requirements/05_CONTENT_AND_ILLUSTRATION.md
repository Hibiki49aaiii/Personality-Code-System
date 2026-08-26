# 05 — Type Content and Illustration Requirements

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

## Editorial requirements

- **PCS-CONTENT-001** Copy MUST match the diagnostic claims allowed by the measured traits/interactions.
- **PCS-CONTENT-002** Copy MUST not imply clinical diagnosis.
- **PCS-CONTENT-003** Copy MUST avoid universal statements where the underlying measurement is continuous/probabilistic.
- **PCS-CONTENT-004** Positive and adversarial interpretations MUST be derived from the same model rather than unrelated flattering/negative stereotypes.
- **PCS-CONTENT-005** Similar types SHOULD be explicitly differentiated so users can understand why their code differs.
- **PCS-CONTENT-006** Public-facing Japanese terminology MUST remain consistent across questions, results, help pages, and social cards.

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

- **PCS-ART-001** One approved hero illustration per published Core Type.
- **PCS-ART-002** Source/master asset retained outside runtime optimization pipeline where practical.
- **PCS-ART-003** Web-optimized variants generated deterministically from approved masters.
- **PCS-ART-004** Asset filenames/IDs use stable type/asset version references.
- **PCS-ART-005** Runtime generation is prohibited.
- **PCS-ART-006** If generative tools are used during development, outputs must be human-reviewed, licensed/usable, curated, committed/versioned like any normal design asset, and no model/API is needed by production.

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
