# PCS Illustration System — v0.1-dev

Status: **art-direction foundation / no production assets approved**

The PCS illustration layer exists to make a type recognizable and collectible without turning the product into an AI-art showcase. Production does not generate images at runtime. Every released illustration is a curated, versioned static asset.

## 1. Visual objective

The target visual language is **editorial print illustration + modern character iconography**:

- 2D rather than glossy 3D;
- clear silhouettes readable at small sizes;
- restrained paper/ink texture rather than synthetic glow;
- deliberate geometric props and environments;
- expressive but not exaggerated facial emotion;
- enough detail for a result page, but strong enough shape language for a social card crop;
- one coherent art family across all types.

The result should feel like a designed personality publication, not an AI SaaS landing page.

## 2. Prohibited visual tropes

Do not use the following as the main PCS identity:

- blue/purple neon glow;
- glassmorphism or holographic cards inside the illustration;
- humanoid robots or robot brains;
- glowing neural-network heads;
- floating source code;
- generic galaxy/brain imagery;
- random sparkles or magic particles;
- glossy 3D avatars;
- photorealistic synthetic portraits;
- type-specific beauty, wealth, gender, race, body-type or social-status stereotypes;
- visual ranking where some types look more powerful, intelligent or prestigious than others.

## 3. 64-type composition model

Illustration identity is derived from the same C01D components used by the development display-name system:

`8 role motifs × 4 action compositions × 2 relationship compositions = 64 type slots`

This is an art-direction grammar, not runtime combinatorial generation. Final production still requires **one approved hero asset per published type**.

### 3.1 Role motif — Core positions 1–3

| Key | Draft role | Primary motif vocabulary |
|---|---|---|
| `LTG` | 調律師 | calibration dial, aligned markers, balanced small objects |
| `LTA` | 実務家 | compact toolkit, work surface, practical assembly |
| `LVG` | 監査士 | inspection lens, checklist marks, measured samples |
| `LVA` | 独立検証者 | portable lens, compass, independently marked evidence |
| `STG` | 編成家 | modular tiles, threads, shared structural board |
| `STA` | 構築家 | scaffold, blocks, blueprint-like construction grid |
| `SVG` | 検証設計家 | measurement grid, aligned blueprint, comparison overlays |
| `SVA` | 探究設計家 | blueprint + compass, branching structure, rebuilt model |

Props are metaphors only. They must not imply a literal profession or credential.

### 3.2 Action composition — Core positions 4–5

| Key | Draft action | Pose/composition cue |
|---|---|---|
| `PF` | 深化/準備 | seated or stable posture, focused work area, layers being refined |
| `PN` | 構想 | branching alternatives, sketch cards, several paths before commitment |
| `EF` | 実践 | active hands-on movement, one clear path already in progress |
| `EN` | 開拓 | forward motion, opening/threshold/path expansion, exploration while acting |

Action composition must not imply productivity or courage rankings.

### 3.3 Relationship composition — Core position 6

| Key | Draft relation | Environmental cue |
|---|---|---|
| `B` | 広縁 | several lightweight connection points distributed through the scene |
| `D` | 深縁 | one or two visually stronger anchor connections with more shared detail |

Use abstract links, objects, or secondary silhouettes rather than stereotypes about extroversion/introversion.

## 4. Character system

- Characters are stylized and non-photorealistic.
- Body proportions remain consistent across the catalog.
- No type is assigned a fixed gender, ethnicity, attractiveness level, age hierarchy, or disability status based on psychology.
- The catalog may intentionally vary representation, but variation is editorial distribution rather than a diagnostic mapping.
- Facial expression differences should communicate scene focus, not value judgments.

## 5. Palette system

The site remains warm, print-like and low-glare. Illustration palettes should use:

- one shared neutral paper/background family;
- one shared ink/dark line family;
- role-level accent families for recognition;
- action-level secondary accents only where contrast remains stable;
- no meaning such as “red = bad type” or “gold = superior type”.

Exact color tokens are approved later with accessibility checks and stored as design tokens rather than hand-picked per illustration.

## 6. Texture and line language

Preferred:

- clean vector-like silhouette edges;
- occasional hand-ink irregularity;
- sparse grain/paper texture;
- flat fills and limited tonal steps;
- intentional negative space.

Avoid texture noise that looks like image-generation artifacts. Hands, props, geometry, edges and repeated symbols must be manually reviewed.

## 7. Master and web asset contract

Each approved type eventually receives:

- one versioned source/master asset;
- `result-portrait` web variant;
- `og-landscape` web variant;
- `share-portrait` web variant.

The master must contain no baked-in localized type name or paragraph copy. Text is rendered by the application so localization and accessibility remain independent of the illustration.

Asset identity follows:

`ILL-C01D-<CORE_CODE>-HERO-vNN`

Example:

`ILL-C01D-SVAEND-HERO-v01`

Changing an approved master creates a new asset version; historical snapshots/share representations must continue to reference their exact asset version where required by the final snapshot contract.

## 8. Crop safe zones

All compositions must be designed so the primary subject survives:

- portrait result hero crop;
- 1.91:1 Open Graph landscape crop;
- portrait social/share crop.

Critical face/hand/identity prop geometry must remain inside a central safe region. Background motifs may extend beyond it.

## 9. Development asset slots and production briefs

The machine-readable art system is stored under `data/illustration/v0.1-dev/`. A deterministic slot materializer maps all 64 reachable development Core Codes to stable asset IDs and component keys.

A second deterministic brief layer maps those slots to exact scene/style/crop/prohibited-trope/review requirements and a balanced catalog-index-only representation rotation. Representation is editorial diversity planning and is never inferred from personality data.

An `unproduced` or `brief-ready-asset-unproduced` slot is not an illustration. It exists so the repository can detect missing, duplicate or incorrectly mapped assets before public release.

## 10. Review gates for one hero asset

An asset can move from `draft` to `approved` only after review for:

- anatomy/geometry errors;
- consistency with the shared style;
- correct role/action/relationship motif mapping;
- no unsupported psychological symbolism;
- no accidental prestige hierarchy;
- desktop/mobile readability;
- OG and portrait crop safety;
- license/source provenance;
- static asset version metadata.

## 11. Production gate

Phase 3B cannot be marked complete until every reachable **published** Core Type has an approved hero asset and required variants. Development C01D slots can be prepared before Phase 5C, but they remain `public_use=false` and may need migration if the final public Core schema changes.
