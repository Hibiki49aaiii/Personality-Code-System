# Phase 3B-1 Art Direction Review — v0.2

Status: **OWNER APPROVED — ART DIRECTION ONLY**

Date: 2026-09-08

Supersedes: `illustration-art-direction-reference-v0.1-dev`

## Decision

The original static-vector prototype direction was rejected by the repository owner because it read as diagrammatic, template-like and visibly synthetic rather than as convincing character-led editorial artwork.

A new LTGPFB reference was iterated until the owner accepted the overall direction. The accepted baseline prioritizes a believable person in a plausible lived-in environment, restrained editorial treatment and selective motif use rather than explanatory iconography.

This approval does **not** approve unseen individual type assets and does not change C01D publication status.

## Approved direction

- character-first, situation-first composition;
- naturalistic and imperfect environments;
- asymmetry and incidental real-world clutter rather than staged prop walls;
- ordinary body language rather than generic personality-poster posing;
- motivated/available-light feeling rather than universal cinematic glow;
- props used selectively as scene-native motifs;
- no type-specific prestige, beauty or protected-attribute mapping;
- production masters contain no baked-in localized text;
- each type must vary scene, pose and visual identity enough to avoid a templated 64-card set.

## Anti-AI visual guardrails

Reject assets that exhibit any of the following:

- repeated generic attractive-face template;
- repeated chin-in-hand or wistful-window pose;
- fantasy scholar atelier used as a universal setting;
- excessive books + plants + dried flowers + antique instruments bundle;
- symmetric explanatory object staging;
- universal golden-hour/rim-light treatment;
- micro-detail noise standing in for intentional design;
- pseudo-writing or malformed text inside final artwork;
- duplicated/fused objects, anatomy defects or inconsistent reflections;
- obvious prompt-collage composition where every trait is represented literally.

## Reference evidence

Repository preview:

`artwork/illustration/references/phase-3b-1-v02/LTGPFB-art-direction-v02-reference.jpg`

Preview SHA-256:

`d128afae7ff5216e66be0193f4a2047f1afac6b5cdf1cfa038951d7c75730b9f`

Owner-reviewed source SHA-256:

`c4ac1daeab34b332885ed0ff003d3b18967390c4ce3251c12f9103025a7bcfd8`

The committed reference is a reduced archival preview. It is **not** the production master and is not inserted into the runtime asset registry.

## Gate result

Phase 3B-1 art direction gate: **PASS**.

Phase 3B-2 production may proceed, but every generated asset must enter the production registry as `review-required`, remain `public_use=false`, and require separate human review before `approved`.

C01D remains **DEVELOPMENT / NOT VALIDATED / NON-PUBLIC**. Runtime generation remains disabled.
