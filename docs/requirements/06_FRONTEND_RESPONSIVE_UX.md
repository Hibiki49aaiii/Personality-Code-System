# 06 — Frontend, Responsive UX, Accessibility and Performance Requirements

## Master-ID reservation

`REQUIREMENTS.md` owns the top-level meanings of **PCS-FE-001..005**, **PCS-A11Y-001..002**, and **PCS-PERF-001**. This derivative file MUST NOT redefine them. Detailed responsive clauses use **PCS-FE-010+**.

## Visual/product direction

PCS MUST look like an authored personality/identity publication rather than a generic AI SaaS product. `docs/DESIGN_SYSTEM.md` provides supporting direction; this file defines release requirements.

## Responsive architecture

- **PCS-FE-010** Responsive behavior MUST be driven by CSS layout/media/container logic, not user-agent device detection.
- **PCS-FE-011** Core functionality MUST work from 320 CSS px width upward.
- **PCS-FE-012** Desktop and mobile may use different arrangements, but must expose equivalent diagnostic choices and information.
- **PCS-FE-013** No core content may require horizontal scrolling at supported widths.
- **PCS-FE-014** Breakpoints SHOULD be content-driven; device names are documentation shorthand only.

Mandatory verification widths:

- 320
- 375 and/or 390
- 768
- 1024
- 1280
- 1440+

The existence of responsive CSS is not sufficient evidence for Master **PCS-FE-005**. The required widths must be explicitly exercised and recorded through visual/functional QA.

### Current responsive verification

The development application now has automated functional width coverage at:

- 320 × 844;
- 390 × 844;
- 768 × 1024;
- 1024 × 768;
- 1280 × 800;
- 1440 × 900.

The test checks landing and assessment controls at each width, and checks the completed private result across the same width matrix. Document/body scroll width must not exceed the viewport width. CI Run `33044207630` (Run 329) passes this matrix. This closes Master **PCS-FE-005** for the current application scope.

This functional matrix is supplemented by committed screenshot-diff regression coverage. Master **PCS-QA-006** is now verified for the current development application through 16 Linux/Chromium baselines: landing and first-assessment at all six mandatory widths, plus completed private result and sanitized public share at 390/1440. Normal CI compares without updating snapshots. See `docs/reviews/VISUAL_REGRESSION_QA_v0.1.md` and CI Runs 343/344.

## Landing page

MUST include:

- concise product proposition;
- clear start action;
- non-clinical/measurement framing;
- explanation of Core Type + detailed profile concept;
- privacy/account expectation;
- no fake population statistics/testimonials.

## Assessment screen

MUST provide:

- one clear question/task focus;
- question progress;
- readable question text;
- explicit answer labels;
- selected state not conveyed by color alone;
- back navigation;
- safe forward navigation;
- protection against accidental double-submit;
- current-answer restoration when returning to an item.

Desktop MAY use horizontal five-point responses. Narrow mobile SHOULD use full-width vertical rows when needed. The semantic order/value mapping MUST remain identical.

### Current Phase 2C implementation evidence

The real assessment UI now consumes the server-delivered reviewed development model rather than prototype questions. Browser E2E verifies:

- anonymous session start;
- real 147-item progress;
- answer save;
- back navigation and answer edit;
- completion;
- result navigation;
- result persistence after reload.

This satisfies the current implementation scope of Master **PCS-FE-003**, but does not close responsive-width or accessibility release gates.

## Result page

The result SHOULD read like a personal dossier/editorial profile rather than a metrics dashboard.

Required hierarchy:

1. Core Code / type name / illustration.
2. Identity summary.
3. Measurement/confidence overview.
4. Detailed domains.
5. Adversarial analysis.
6. Personal manual / growth section.
7. Share controls.
8. Method/version/limitations access.

Charts must be interpretable and not imply false precision beyond the scoring system.

The current development result page renders deterministic Core/Extended Code, 21 canonical Trait scores, response-quality metadata, 18 structured result domains, immutable version metadata and private-result state. Final public type name/illustration/share controls remain later phases. This is the implementation evidence for Master **PCS-FE-004** at the Phase 2C development level.

## Accessibility

Release-blocking baseline:

- semantic landmarks/headings;
- correct labels for all form controls;
- keyboard-only completion from landing through result;
- visible focus indicators;
- no keyboard trap;
- selected/error states not color-only;
- sufficient text/UI contrast;
- usable at browser text zoom;
- mobile touch targets sized appropriately;
- screen-reader comprehensible progress/question/options;
- reduced motion honored;
- animation never blocks access to result content;
- errors associated with relevant controls.

Target WCAG level: practical WCAG 2.2 AA conformity for user-facing core flows, with documented exceptions if any.

Current accessibility automation now includes an independent keyboard/touch/a11y suite.

### Current keyboard and accessibility evidence

CI Run `33044207630` (Run 329) verifies:

- all 147 assessment questions and finalization can be completed using actual `Tab`, `Shift+Tab`, `Space`, and `Enter` traversal without pointer/touch activation;
- assessment progress is exposed as a semantic progressbar with current/max/readable value text;
- the response radiogroup is explicitly labelled by the current question;
- saving/errors expose busy/alert relationships;
- result Trait bars are semantic meters with readable 0–100 values;
- visible keyboard focus is present;
- reduced-motion mode suppresses non-essential transition timing;
- practical assessment targets are at least 44 CSS px high in the mobile check;
- a touch-enabled 390px mobile context can select/advance without overflow;
- `@axe-core/playwright` reports no WCAG A/AA-tagged violations on the tested landing, first assessment screen, and completed private result.

Axe initially found actual color-contrast defects in the landing, assessment supplemental text, and private-result metadata. The palette was corrected rather than excluding those rules.

This closes Master **PCS-A11Y-001** for keyboard-only assessment completion.

Master **PCS-A11Y-002** remains open because automated checks cannot replace a release walkthrough with real assistive technology, browser text zoom/text scaling, final production illustrations/content, and broader manual focus/touch review.

Detailed evidence boundary: `docs/reviews/RESPONSIVE_ACCESSIBILITY_QA_v0.1.md`.

## Motion

Motion MUST be functional/restrained. Prohibited as primary design language:

- decorative particle fields;
- constant glow/pulsing;
- long mandatory result reveals;
- animation that delays answering.

## Visual anti-AI constraints

Avoid by default:

- black/purple neon gradient branding;
- excessive glassmorphism;
- chat bubbles as main information architecture;
- “sparkle/magic wand” motifs;
- generic AI orb/avatar;
- “AI-powered” value proposition;
- excessive pill controls and floating cards.

## Performance budgets

Before launch establish measured budgets. Initial requirements:

- avoid shipping unnecessary client-side JavaScript for static result/content sections;
- images use responsive dimensions/formats;
- hero illustration has explicit dimensions/aspect handling to prevent layout shift;
- fonts must not block content excessively;
- diagnostic logic should be small/pure and not require heavyweight runtime libraries;
- third-party scripts minimized and deferred where possible.

## Core Web Vitals

Public launch requires acceptable field/lab performance with priority on:

- LCP;
- INP;
- CLS.

Exact thresholds should align with contemporary Core Web Vitals guidance and be recorded in release QA rather than hardcoded forever in this document.

## Frontend test evidence

Implemented/green in current development CI:

- functional width matrix at all mandatory widths;
- actual keyboard-only 147-item assessment completion;
- automated axe WCAG A/AA scan of core pages;
- reduced-motion verification;
- touch-enabled mobile assessment test;
- horizontal-overflow assertions.

Still required for release:

- screenshot/visual-regression baselines at critical widths;
- real screen-reader / assistive-technology walkthrough;
- browser text zoom/text-scaling verification;
- result-page long-content stress review with final production content;
- Japanese wrapping/long public type-name stress review after public names are approved.
