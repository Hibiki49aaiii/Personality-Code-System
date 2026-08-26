# Design System — Foundation v0.2

> Requirement authority: `REQUIREMENTS.md` and `docs/requirements/` take precedence over this supporting design document.

## 1. Visual direction

Personality Code System should feel like a carefully authored psychological publication and identity system, not an AI product dashboard.

Keywords:

- editorial
- archival
- measured
- tactile
- precise
- human-authored
- contemporary Japanese / international magazine sensibility

## 2. Explicit anti-patterns

Avoid by default:

- black-to-purple AI gradients
- neon cyan / violet glow
- floating glassmorphism cards everywhere
- chat bubbles as primary UI language
- sparkles / magic wand AI iconography
- excessive pill-shaped controls
- generic SaaS dashboard grids
- random animated particles
- overuse of blurred gradients
- generic AI orb/avatar imagery
- copy such as “AI-powered insights” as the primary value proposition

**Runtime AI is not part of the PCS product architecture.** Development tools may assist implementation or drafting, but the shipped diagnostic/result experience is deterministic and does not depend on generative services.

## 3. Current visual tokens

The first implementation uses a restrained print-like palette:

- warm paper background
- off-white card surface
- near-black ink
- muted stone text
- terracotta accent
- pale sage secondary surface

The exact palette may evolve when the illustration identity is finalized. Tokens must remain semantic CSS custom properties rather than scattered literals in production components.

## 4. Typography

### Display

Serif / Mincho-inspired type for identity statements and major headlines.

Purpose:

- editorial character
- distinction from generic tech products
- stronger personality / reading experience

### Interface / body

Neutral sans-serif / Gothic-inspired system stack for questions, controls, metrics, and long reading.

Typography should create hierarchy primarily through scale, spacing, and weight rather than decorative effects.

## 5. Layout

Desktop:

- generous whitespace
- asymmetrical editorial grids where useful
- strong horizontal rules
- result specimen / illustration can sit beside narrative copy

Mobile:

- single-column flow
- preserve hierarchy, not the desktop geometry
- answer controls become full-width rows when five-column scales are too narrow
- avoid horizontal scrolling for core content
- all critical actions reachable comfortably by touch

## 6. Responsive requirements

Target behavior must be tested at minimum around:

- 320px narrow mobile
- 375 / 390px common mobile
- 768px tablet
- 1024px laptop / tablet landscape
- 1280px desktop
- 1440px+ wide desktop

Use content-driven CSS breakpoints/container behavior rather than user-agent/device-name assumptions. The same diagnostic answer must map to the same semantic value regardless of layout.

## 7. Assessment interaction

Question pages should prioritize one task at a time.

Required:

- visible progress
- large readable question
- clear response labels
- selected state that is not color-only
- keyboard focus state
- back navigation
- disabled/safe next state before valid answering as applicable
- no timed pressure by default
- answer restoration when navigating back

On desktop a horizontal Likert scale is acceptable. On narrow mobile the same answers should become vertically stacked rows.

## 8. Result page principles

The result page should resemble a personal dossier / magazine profile rather than a dashboard.

Recommended rhythm:

1. Core code + name + illustration
2. identity sentence
3. measurement/confidence overview
4. narrative domains
5. adversarial analysis
6. relationship / work / stress detail
7. personal manual
8. share controls
9. method/version/limitations access

Charts should be simple and interpretable. Avoid novelty visualizations that obscure the underlying score or imply unsupported precision.

## 9. Illustration system

Illustrations are a primary brand asset, not decoration.

Initial plan:

- one curated hero illustration per published Core Type
- consistent art direction across all types
- controlled deterministic visual modifiers only if later justified
- characters recognizable at social-card size

Do not generate each result from an unconstrained prompt at runtime. Artwork must be reviewed, curated, versioned, and reproducible.

## 10. Accessibility

Baseline requirements:

- semantic HTML
- visible focus indicators
- sufficient text/UI contrast
- touch targets sized for mobile
- reduced-motion support
- no information conveyed by color alone
- form controls readable by assistive technology
- content remains usable at browser text zoom
- keyboard-only assessment completion

Target practical WCAG 2.2 AA for the core flow; release exceptions must be documented.

## 11. Motion

Motion should be rare and functional:

- question progress
- restrained page/section transitions
- optional result reveal that never delays access

Respect `prefers-reduced-motion`.

Avoid continuous ambient effects that make the product resemble an AI demo.

## 12. Voice

Copy should be specific, calm, evidence-oriented, and conditional where appropriate.

Avoid:

- mystical certainty
- exaggerated praise
- pseudo-scientific claims
- “we know you better than you know yourself”
- superiority/rarity bait unsupported by observed data
- robotic AI disclaimers in every section

Prefer:

- observed/measured tendency
- conditional phrasing
- distinction between measurement, interpretation, and observed sample statistics
- direct but non-abusive adversarial analysis

## 13. Detailed authority

For release-blocking responsive/accessibility/performance requirements, refer to `docs/requirements/06_FRONTEND_RESPONSIVE_UX.md`.

For illustration/content production constraints, refer to `docs/requirements/05_CONTENT_AND_ILLUSTRATION.md`.
