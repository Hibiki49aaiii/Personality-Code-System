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
8. writes that commit back only to the branch that triggered the workflow;
9. uploads the same files as a short-lived Actions artifact for independent inspection.

The writeback step is fail-closed: it requires a branch ref and refuses tag/detached/unresolved targets. It never force-pushes. A branch movement or rebase conflict must stop the job instead of overwriting another branch.

For an intentional feature-branch visual change, use an `issue-*` branch and change the visual-regression spec (normally an explicit baseline-refresh marker) or the baseline workflow itself. Those path-limited changes may trigger the dedicated baseline workflow on that issue branch. Generated PNGs remain reviewable in the PR before they can reach `main`.

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
- the original enforced baseline was proven by CI Run 343 (`33047133202`) and Run 344 (`33047140525`), with Visual Baseline Run 7 reproducing that historical set from `npm ci`;
- PR #11 intentionally refreshed the six landing screenshots for the editorial landing revision;
- current normal comparison is green in CI Run 762 (`33240042395`) and remains green after the branch-safe baseline workflow change in CI Run 764 (`33240600043`);
- current Visual Baseline Run 18 (`33240600054`) reproduced all committed baselines without requiring a new baseline commit.

Future intentional visual changes must follow the baseline-change rule above.

