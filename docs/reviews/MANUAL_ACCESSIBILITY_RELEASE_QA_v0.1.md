# Manual Accessibility Release QA v0.1

> Status: **not yet executed**
> Purpose: release evidence template for PCS-A11Y-002 / PCS-QA-005
> Date created: 2026-08-27

## Why this remains manual

Automated axe, semantic assertions, keyboard traversal, touch/mobile checks, reduced-motion checks and the 200% root-text-scale regression test catch many defects but do not prove real assistive-technology usability.

This record must not be marked complete from CI alone.

## Test environments to record

Before public launch, record at least one representative pass for each supported interaction class:

- Desktop screen reader + keyboard: browser / OS / screen-reader version.
- Mobile screen reader + touch: browser / OS / screen-reader version.
- Browser zoom/text scaling: browser / OS / zoom/scaling setting.
- Reduced motion: OS/browser preference.
- Touch-only mobile: device/browser.

Recommended practical coverage for Japanese PCS at release time:

- Windows + current Chromium + NVDA or another supported Japanese desktop screen reader;
- iOS Safari + VoiceOver and/or Android Chrome + TalkBack;
- desktop browser 200% zoom/text enlargement;
- mobile system text enlargement where it materially affects the app.

Exact products/versions are evidence fields, not timeless requirements.

## Core flow

For each environment:

1. Open landing.
2. Identify service name, product purpose, non-clinical/development limitation and primary diagnosis CTA.
3. Start assessment without account creation.
4. Confirm current question and progress are announced/understandable.
5. Select all five response options by the tested interaction mode.
6. Navigate back and confirm the existing answer is restored.
7. Continue through enough questions to establish repeated interaction semantics; at least one complete 147-item keyboard/screen-reader flow should be performed before launch.
8. Finalize.
9. Identify Core Code, Trait Vector, measurement/confidence metadata and section hierarchy.
10. Reach adversarial/growth/manual sections without focus loss.
11. Create a public share explicitly.
12. Confirm public share exposes only sanitized content.
13. Revoke the share and confirm the link becomes unavailable.
14. Reach the diagnostic data control, understand that deletion is irreversible and affects private/public result data, open the confirmation state, then cancel once to verify safe focus/state restoration.
15. Re-open the deletion confirmation and verify the `削除を確定` action, warning text and cancellation control are announced distinctly. Execute destructive deletion only in a disposable QA session and confirm the browser returns to a non-authenticated state.

## Pass criteria

- No keyboard trap or inaccessible control.
- Visible focus remains understandable where visual testing applies.
- Control name/role/state is understandable.
- Progress/question relationships are announced in a meaningful order.
- Selected state is not dependent on color.
- Error/busy state is announced when triggered.
- 200% zoom/text enlargement does not lose core content or require two-dimensional scrolling for ordinary text.
- Touch targets remain practically operable.
- Reduced motion does not hide/delay required content.
- Result hierarchy is navigable by headings/landmarks.
- Share action is clearly explicit; private/public distinction is understandable.
- Destructive diagnostic deletion is distinguishable from share revocation, exposes an irreversible warning before execution, provides a cancel path, and does not lose focus/context unexpectedly.
- Japanese punctuation/code labels are not read in a way that makes the core result unusable.

## Evidence table

| Surface | Environment | Tester/date | Result | Issue IDs / notes |
| --- | --- | --- | --- | --- |
| Landing | pending | pending | NOT RUN | |
| Assessment | pending | pending | NOT RUN | |
| Private result | pending | pending | NOT RUN | |
| Public share | pending | pending | NOT RUN | |
| Revoke/error flow | pending | pending | NOT RUN | |
| Diagnostic self-deletion | pending | pending | NOT RUN | |

## Closure rule

PCS-A11Y-002 / PCS-QA-005 may close only when:

- automated accessibility CI is green;
- 200% scaling regression is green;
- this manual record contains real executed evidence rather than placeholders;
- any release-blocking issue is fixed or explicitly documented/approved under the requirements process.

`data/accessibility/manual-release-review-v0.1-dev.json` mirrors the fail-closed execution state in machine-readable form. CI validates that no tester/device evidence or PASS state is fabricated.

This file intentionally remains `NOT RUN` until a human/device walkthrough occurs.
