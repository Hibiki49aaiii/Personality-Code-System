# Issue #9 Implementation Plan — Public Landing Editorial Refresh

## Metadata

- Issue: #9 `feat: public landing experienceを完成度の高いPersonality Codeサイトへ刷新`
- Base Commit SHA: `2739533a72d07539a9be1fbe8f7fa34fd2885d31`
- Base branch: `main`
- Working branch: `issue-9-landing-editorial-refresh`

## Requirements

1. Preserve the existing reviewed headline and claim-boundary strings.
2. Improve above-the-fold comprehension without adding client runtime.
3. Make anonymous/private-first behavior visible near the primary CTA.
4. Communicate deterministic method and actual development-scale proof (147 items / 21 measured Traits) without implying validation.
5. Make result-dossier coverage and adversarial interpretation easy to scan.
6. Preserve explicit share/export semantics.
7. Keep all assessment/result/share domain and persistence code unchanged.
8. Regenerate landing visual baselines intentionally.

## Current Architecture

The landing is a server component in `src/app/page.tsx` plus `LandingAnalytics`.

The visual system is global authored CSS:
- warm paper background
- near-black ink
- brick accent
- sage secondary surface
- serif display + sans-serif utility typography
- square/rule-driven editorial geometry

Existing landing structure:
1. header
2. hero + result specimen
3. manifesto
4. three-layer method
5. six-domain list
6. adversarial section
7. share preview
8. closing CTA
9. legal/development footer

The page already avoids generic AI UI motifs. The issue is primarily information hierarchy and publication-grade product proof.

## Target Architecture

Keep the same server-rendered page and design primitives, but restructure the landing as an editorial dossier:

1. **Header** — brand / section anchors / compact CTA.
2. **Hero** — existing reviewed headline, stronger CTA hierarchy, visible accountless/private-first note, result specimen.
3. **Evidence rail** — 147 items / 21 Traits / deterministic scoring / private-first.
4. **Principle manifesto** — preserve non-clinical/development claims.
5. **Method sequence** — Trait Vector → Core Type → Extended Code with explicit “measured / compressed / preserved” hierarchy.
6. **Result dossier** — six domains as an indexed reading system rather than generic feature cards.
7. **Adversarial lens** — paired “strength ↔ failure mode” examples.
8. **Privacy/export protocol** — anonymous start → private result → explicit share.
9. **Share specimen** — existing sanitized public-share concept.
10. **Closing CTA** — repeat accountless/private-first behavior.

No new component dependency or client state.

## Data Flow

No application data flow changes.

Landing links continue to route to `/diagnosis`.

The page displays development-only static specimens and factual repo-level counts. It does not read assessment records or generate dynamic scores.

## State Transitions

None. Landing remains stateless aside from existing analytics side effect.

## Files

### Change
- `src/app/page.tsx`
- `src/app/globals.css`
- `.github/workflows/visual-baseline.yml`
- `tests/e2e/visual-regression.spec.ts`

### Add
- `docs/ai/issues/9/IMPLEMENTATION_PLAN.md`

### Generated
- landing PNG baselines at six viewports

### Unchanged
- assessment/result/share runtime
- DB/migrations
- domain/scoring
- dependencies

## Visual Baseline Workflow

Current workflow hard-codes:
- `git pull --rebase origin main`
- `git push origin HEAD:main`

That is unsafe for `workflow_dispatch` on a feature ref.

Change it to use `GITHUB_REF_NAME` as the target branch. On normal main push this remains `main`; on manual feature-branch dispatch it writes baselines to that feature branch.

Guard against missing/HEAD ref before push.

This is a durable workflow correction, not a temporary workaround.

## Error Handling

No new runtime error path.

The baseline workflow must fail if it cannot determine a writable branch target rather than silently pushing to main.

## Accessibility

- keep one h1
- h2/h3 order remains hierarchical
- nav labels preserved
- links remain native anchors
- focus-visible remains global
- no essential content hidden on mobile
- reduced-motion global rule remains
- decorative labels use `aria-hidden` only where non-semantic

## Performance

- no new JS dependency
- no image payload added
- static arrays only
- CSS-only layout
- no animation beyond existing small hover transforms

## Testing Strategy

1. `validate:landing-claims`
2. full typecheck/build
3. normal E2E including responsive/a11y suites
4. manual feature-branch Visual Baseline workflow
5. commit updated snapshots to branch
6. fresh normal CI to compare against frozen baselines
7. CodeQL

## Implementation Order

1. Make baseline workflow branch-safe.
2. Add baseline refresh marker.
3. Rework page information architecture.
4. Refine CSS desktop/tablet/mobile.
5. Check claim strings and static code review.
6. Open PR to trigger static/full tests.
7. Dispatch Visual Baseline on the feature branch.
8. Let workflow commit snapshots.
9. Re-run normal CI.
10. Post-Implementation Review and Issue update.

## Rollback

No migration/runtime state. A normal commit revert restores the previous landing and screenshots.

## Known Risks

- long full-page layout may become visually dense on mobile
- static sample numbers may be read as scientific evidence if context is unclear
- snapshot generation workflow could race with branch updates
- share preview copy must not imply final taxonomy/art approval

# Human Understanding Summary

## What
Turn the existing landing into a more polished editorial personality dossier while preserving all product semantics.

## Why
The app core is already substantial, but the first surface needs to communicate what is actually different about PCS before a user starts 147 questions.

## How
Use the existing paper/ink design language, stronger section hierarchy, factual method/privacy proof and structured specimens. No new frontend framework or runtime AI.

## Important Decisions
- keep the reviewed “16種類では終わらせない” headline
- use current development facts, not validation claims
- make privacy/export flow visible
- keep visual regression as a hard guard
- fix the baseline workflow so branch refresh is safe

## Invariants
- no clinical/validated claim
- C01D remains non-public
- diagnosis remains accountless
- result starts private
- sharing remains explicit
- no runtime generative AI

## Failure Modes
- unsupported claim copy
- mobile overflow
- stale screenshots
- baseline workflow writing to wrong ref
- visual drift from assessment/result surfaces

## Change Impact
Future landing visual changes must intentionally refresh six viewport baselines. The branch-safe workflow allows this without bypassing PR review.
