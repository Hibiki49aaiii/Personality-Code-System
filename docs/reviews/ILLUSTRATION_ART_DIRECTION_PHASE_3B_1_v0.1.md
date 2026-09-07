# Phase 3B-1 Illustration Art-Direction Reference Review — v0.1

Status: **assistant-reviewed / owner decision pending / non-public**

Issue: #41  
Base main SHA: `20fcbe8175672e122465d2d33a23ed16d2dbc12b`

## Purpose

This packet exercises the repository's Phase 3B-1 gate before any canonical 64/64 hero-art batch. The two SVGs are **reference prototypes only**. They do not change `asset-production-registry.json`; the corresponding production assets remain `unproduced` and `public_use=false`.

## Representative coverage

| Core Code | Production asset identity | Role | Action | Relation | Editorial representation rotation |
| --- | --- | --- | --- | --- | --- |
| `LTGPFB` | `ILL-C01D-LTGPFB-HERO-v01` | `LTG` 調律師 | `PF` 深化・準備 | `B` 広縁 | `androgynous-young-adult-a` |
| `SVAEND` | `ILL-C01D-SVAEND-HERO-v01` | `SVA` 探究設計家 | `EN` 開拓 | `D` 深縁 | `hearing-device-neutral` |

Representation rotation is catalog-index-only and is not inferred from psychology, scores, Core Code meaning, gender, ethnicity, age, disability, attractiveness, or social status.

## Proposed art direction

- 2D editorial print / modern character iconography.
- Warm paper field, dark ink geometry, restrained brick accent, muted secondary structural line.
- Clear silhouettes and large identity props.
- No localized text baked into artwork.
- No neon, glassmorphism, robots, neural heads, code, sparkles, galaxy-brain imagery, glossy 3D, photoreal portraiture, or prestige hierarchy.
- Character geometry remains deliberately simplified so scene semantics come from props/composition rather than facial or demographic stereotyping.

### Palette candidate

| Token | Value | Review |
| --- | --- | --- |
| paper | `#f4efe5` | shared neutral |
| panel | `#efe8dc` | shared neutral |
| surface | `#d6c9b8` | low-emphasis object field |
| ink | `#1c2521` | 13.72:1 against paper |
| accent | `#b74631` | 4.66:1 against paper |
| secondary | `#8e9d91` | 2.48:1; background/non-text only |

The secondary tone is intentionally not used for critical text or sole identity geometry.

## Prototype A — LTGPFB

Reference: `artwork/illustration/references/phase-3b-1/LTGPFB-reference-v01.svg`

SHA-256: `532248a4a1d3b51991b01043dd2d2e2eb9b3129bb4dae4ca555d0a0db3735add`

Motif mapping:
- LTG: calibration dial, aligned markers, balanced small objects.
- PF: stable posture, focused work surface, layered refinement rings.
- B: multiple lightweight anchor points distributed around the scene.

Crop review:
- Master/result/share aspect is 4:5 (`1600×2000`).
- Central 1.91:1 OG safe band is approximately `y=581..1419`.
- Face, hands, calibration dial and aligned-marker group remain inside that band.
- Peripheral B anchors may crop; they are contextual rather than critical identity geometry.

## Prototype B — SVAEND

Reference: `artwork/illustration/references/phase-3b-1/SVAEND-reference-v01.svg`

SHA-256: `43fb30fda4e20282a2a863c0dd88e75bd6a95f30d0924806738abd6dbed5d49c`

Motif mapping:
- SVA: blueprint-like board, compass, branching/rebuilt structure.
- EN: threshold/path-expansion cue and forward structural axis.
- D: two visually stronger anchor connections with shared detail.
- `hearing-device-neutral` is present only because this slot is index 63 in the existing editorial rotation.

Crop review:
- Master/result/share aspect is 4:5 (`1600×2000`).
- Central 1.91:1 OG safe band is approximately `y=581..1419`.
- Face, hearing-device detail, hands, blueprint board, compass and strong D anchors remain inside that band.
- Lower path expansion can crop without losing the role identity.

## Assistant QA

Both prototypes were inspected at full portrait framing and at a central 1.91:1 crop.

- [x] motif-to-type mapping
- [x] shared style consistency
- [x] anatomy/geometry at prototype-iconography level
- [x] no prestige hierarchy
- [x] no diagnostic stereotype
- [x] result crop
- [x] OG crop
- [x] share crop
- [x] source/provenance recorded
- [x] runtime generation absent
- [x] production registry remains untouched

## Owner gate

The repository requirement still needs an explicit owner art-direction decision before a canonical 64-asset batch.

Current decision: **PENDING**

An owner approval should freeze an immutable art-direction reference version and authorize the next production batch. A rejection/revision should update these reference prototypes without modifying production asset IDs or claiming that C01D is public/validated.
