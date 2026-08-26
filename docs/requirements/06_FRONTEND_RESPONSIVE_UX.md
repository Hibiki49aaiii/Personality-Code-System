# 06 — Frontend, Responsive UX, Accessibility and Performance Requirements

## Visual/product direction

PCS MUST look like an authored personality/identity publication rather than a generic AI SaaS product. `docs/DESIGN_SYSTEM.md` provides supporting direction; this file defines release requirements.

## Responsive architecture

- **PCS-FE-001** Responsive behavior MUST be driven by CSS layout/media/container logic, not user-agent device detection.
- **PCS-FE-002** Core functionality MUST work from 320 CSS px width upward.
- **PCS-FE-003** Desktop and mobile may use different arrangements, but must expose equivalent diagnostic choices and information.
- **PCS-FE-004** No core content may require horizontal scrolling at supported widths.
- **PCS-FE-005** Breakpoints SHOULD be content-driven; device names are documentation shorthand only.

Mandatory verification widths:

- 320
- 375 and/or 390
- 768
- 1024
- 1280
- 1440+

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

- screenshots/visual regression at required widths;
- keyboard walkthrough;
- automated accessibility scan;
- reduced-motion verification;
- touch-device assessment test;
- result-page long-content stress test;
- Japanese text wrapping/long type-name stress test.
