# Personality Code System

A high-resolution personality assessment platform designed for reproducible scoring, interpretable personality codes, detailed domain analysis, and shareable results.

## Product principles

1. **Deterministic diagnosis core** — scores, codes, module selection, and results are produced by versioned rules/assets, not free-form AI output.
2. **No production AI runtime** — the shipped diagnosis/result flow does not require an LLM, generative model, AI API key, or runtime image generation.
3. **Psychometric-first** — the question bank, scoring model, reliability checks, and future calibration are first-class product assets.
4. **Human-designed visual identity** — editorial, psychological-assessment-inspired UI; no generic AI-chat aesthetic, neon glow, or gratuitous gradients.
5. **Responsive by default** — the same product must feel intentional on mobile, tablet, and desktop.
6. **Shareable identity** — results should be easy to understand, save, compare, and share without exposing raw answers.
7. **Versioned results** — assessment/code/content/asset versions are preserved so historical results remain reproducible.

## Authoritative development requirements

Development is governed by:

- [`REQUIREMENTS.md`](REQUIREMENTS.md) — master requirements and delivery checklist.
- [`docs/requirements/`](docs/requirements/) — detailed derivative requirements by domain.

When a design/research note conflicts with these requirements, the requirements win. Requirement changes must be explicit and version-impact reviewed.

## Initial stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- CSS custom properties + authored responsive CSS
- Planned: PostgreSQL + versioned relational persistence
- Planned: privacy-reviewed analytics, error monitoring, deterministic share-card rendering

## Product architecture

The system separates three diagnostic identity layers:

- **Trait Vector** — continuous internal trait scores.
- **Core Type** — compact, human-readable personality identity.
- **Extended Code** — sub-traits and interaction modifiers that preserve individual differences within the same Core Type.

Application architecture further separates framework-independent diagnostic domain logic from UI and infrastructure.

## Supporting specifications

- [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md) — product foundation/specification.
- [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) — visual and interaction direction.
- [`docs/DIAGNOSTIC_MODEL.md`](docs/DIAGNOSTIC_MODEL.md) — exploratory diagnostic model draft.

## Development status

Foundation phase complete enough to begin formal measurement design:

- application scaffold: complete
- responsive visual prototype: complete
- CI typecheck + production build: complete
- authoritative requirement system: complete
- Trait Dictionary v0.2: next
- item bank/scoring engine: not yet frozen/implemented

Do not treat prototype questions or provisional trait definitions as the final diagnostic model.
