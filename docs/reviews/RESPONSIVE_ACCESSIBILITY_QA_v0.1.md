# Responsive & Accessibility QA Evidence v0.1

> Status: development verification record
> Date: 2026-08-27
> Scope: current development landing / 147-item assessment / private result
> This record does not claim full WCAG conformance or final release accessibility approval.

## Mandatory responsive widths

Automated functional QA exercises:

- 320 × 844
- 390 × 844
- 768 × 1024
- 1024 × 768
- 1280 × 800
- 1440 × 900

At each required width the tests verify the relevant core page remains visible and does not create document-level horizontal overflow.

The private result is resized through the same width matrix after a completed 147-item assessment.

## Keyboard-only assessment

The strengthened keyboard test does not invoke pointer/touch interaction or direct element-click activation.

It traverses the actual focus order using:

- `Tab`;
- `Shift+Tab`;
- `Space`;
- `Enter`.

It selects the midpoint radio choice, advances all 147 questions, finalizes the assessment, and reaches the deterministic private result.

This is evidence for the current implementation scope of Master `PCS-A11Y-001`.

## Touch path

A Chromium mobile context with `isMobile=true` and `hasTouch=true` verifies:

- 390px assessment rendering;
- tap selection;
- tap advance;
- next-question transition;
- no document-level horizontal overflow.

## Screen-reader semantics implemented

Assessment:

- visible H1 question has stable `assessment-question` ID;
- response group is a labelled `radiogroup`;
- question and response group are explicitly related;
- answer progress is an exposed `progressbar` with current/max/value text;
- saving state uses `aria-busy`;
- save error is an assertive alert and is referenced from the response group;
- loading state uses polite status semantics.

Result:

- canonical Trait bars are exposed as `meter` values with 0..100 range and readable value text.

## Focus / motion / target size

Automated checks cover:

- non-zero visible focus outline on assessment controls;
- reduced-motion media mode suppresses transition duration to a negligible value;
- key assessment navigation/choice targets are at least 44 CSS px high in the 390px mobile test.

## Automated accessibility scan

`@axe-core/playwright` is run against the core journey using WCAG A/AA tags.

Initial scan discovered real contrast defects in:

- landing manifesto label;
- closing-section label;
- inverse CTA;
- private-result development eyebrow/metadata/module IDs.

Those defects were corrected in the accessible palette rather than ignored or excluded from axe.

## Remaining release work

Master `PCS-A11Y-002` and `PCS-QA-005` remain open until release QA additionally records:

- real assistive-technology/screen-reader walkthrough;
- browser text zoom / text-only scaling behavior;
- manual focus-order review beyond the assessment completion path;
- final contrast review after production illustration/content integration;
- final touch-target review across share/public-result controls;
- any documented WCAG 2.2 AA exceptions.

Master `PCS-QA-006` also remains open because explicit visual-regression baselines/diffs are not yet committed.
