# Visual Regression QA v0.1

> Status: verified for current development application; committed baselines pass normal CI comparison mode.
> Date: 2026-08-27

## Purpose

Visual regression is separate from functional responsive QA.

Functional tests prove that controls work and content does not overflow. Screenshot baselines detect unintended visual drift in spacing, typography, composition, hierarchy, responsive rearrangement and public-share presentation.

## Baseline scope

The current development baseline contains 16 Linux/Chromium screenshots.

### Landing

Full-page baseline at:

- 320 × 844
- 390 × 844
- 768 × 1024
- 1024 × 768
- 1280 × 800
- 1440 × 900

### First assessment screen

Full-page baseline at the same six widths.

### Completed private result

Full-page baseline at:

- 390 × 844
- 1440 × 900

### Sanitized public share

Full-page baseline at:

- 390 × 844
- 1440 × 900

The result/share baseline is produced from the deterministic 147-item midpoint path, currently yielding Core Code `SVAEND`.

## Rendering contract

Playwright captures use:

- production Next.js build/server;
- Chromium on Ubuntu runner;
- animations disabled;
- caret hidden;
- committed dependency lockfile;
- fixed viewport dimensions;
- a maximum diff pixel ratio of 0.002.

A baseline generated under another OS/browser is not automatically equivalent.

## Baseline generation

Dedicated workflow:

`.github/workflows/visual-baseline.yml`

It:

1. installs dependencies;
2. applies the real PostgreSQL persistence integration;
3. seeds the reviewed development model;
4. builds the production application;
5. installs the pinned Playwright Chromium dependency;
6. runs only `visual-regression.spec.ts` with `--update-snapshots`;
7. commits the generated baseline PNGs and `package-lock.json` when changed;
8. uploads the same files as a short-lived Actions artifact for independent inspection.

The normal CI MUST NOT use `--update-snapshots`.

## Normal comparison

After baseline files are committed, normal CI sets `PCS_VISUAL_REGRESSION=1` and runs the visual suite in comparison mode.

A visual difference therefore fails CI rather than silently replacing the expected image.

## Baseline-change rule

Changing a baseline is acceptable only when at least one of these is true:

- intentional visual/design change;
- accessibility fix that changes rendered appearance;
- approved content/name/illustration change;
- browser/font/runtime upgrade whose visual effect was reviewed;
- a corrected baseline-generation defect.

A baseline MUST NOT be regenerated solely to make a failing comparison green.

Every baseline-changing commit should identify the reason and affected surfaces.

## Known limitations

Current v0.1 does not yet prove:

- Safari/WebKit rendering parity;
- Windows/browser font rendering parity;
- final production hero illustrations;
- final public type names/copy;
- user-provided OS font overrides;
- all possible long-content combinations.

Those require later release QA or new baseline versions.

## Completion evidence

Master `PCS-QA-006` is verified for the current development application:

- 16 baseline PNGs are committed under `tests/e2e/visual-regression.spec.ts-snapshots/`;
- `package-lock.json` is committed so CI/browser dependencies resolve reproducibly;
- normal CI sets `PCS_VISUAL_REGRESSION=1` and compares without `--update-snapshots`;
- CI Run 343 (`33047133202`) and Run 344 (`33047140525`) passed the committed visual comparison suite;
- dedicated Visual Baseline Run 7 reproduced the same baselines from `npm ci` without requiring a new baseline commit.

Future intentional visual changes must follow the baseline-change rule above.

