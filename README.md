# Personality Code System

A high-resolution personality assessment platform designed for reproducible scoring, interpretable personality codes, detailed domain analysis, and shareable results.

## Product principles

1. **Deterministic diagnosis core** — scores and personality codes are produced by versioned rules, not free-form LLM output.
2. **Psychometric-first** — the question bank, scoring model, reliability checks, and future calibration are treated as first-class product assets.
3. **Human-designed visual identity** — editorial, psychological-assessment-inspired UI; no generic AI-chat aesthetic, neon glow, or gratuitous gradients.
4. **Responsive by default** — the same product must feel intentional on mobile, tablet, and desktop.
5. **Shareable identity** — results should be easy to understand, save, compare, and share on social platforms.
6. **Versioned results** — assessment model versions are preserved so historical results remain reproducible.

## Initial stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- CSS custom properties + authored responsive CSS
- Future: PostgreSQL, Drizzle/Prisma, analytics, image/share-card rendering

## Product architecture

The system separates three layers:

- **Trait Vector** — continuous internal trait scores.
- **Core Type** — compact, human-readable personality identity.
- **Extended Code** — sub-traits and interaction modifiers that preserve individual differences within the same core type.

See `docs/PRODUCT_SPEC.md` and `docs/DESIGN_SYSTEM.md` for the current foundation.

## Development status

Foundation phase. The public-facing shell and design system are being built before the diagnostic scoring model is frozen.
