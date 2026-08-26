# 10 — Testing and QA Requirements

## QA principle

PCS correctness means more than “the page renders.” A release must verify diagnostic determinism, historical reproducibility, responsive usability, accessibility, privacy boundaries, and deployment integrity.

## Test layers

### 1. Domain unit tests

MUST cover:

- item/answer validation;
- keyed and counter-keyed scoring;
- weighted scoring;
- normalization and rounding;
- completion eligibility;
- confidence/quality metadata;
- Core Code generation;
- Extended Code generation;
- threshold/tie behavior;
- interaction activation;
- content precedence/conflict suppression;
- result snapshot serialization;
- version lookup/backward reading.

### 2. Golden diagnostic fixtures

For each published model keep fixed answer fixtures with exact expected:

- raw/normalized scores;
- confidence fields;
- Core Type;
- Extended Code;
- interaction IDs;
- selected content module IDs/order;
- serialized snapshot essentials.

Golden tests are release-blocking. A changed expected result requires an intentional model/content version decision, not casual fixture regeneration.

### 3. Property/invariant tests

Where feasible verify:

- same input/version always equals same output;
- answer input order does not alter result;
- invalid option values never produce scores;
- score remains in valid range;
- no inactive item affects active model;
- a public share payload never contains raw answers/session secrets.

### 4. Integration tests

MUST test:

- start/resume anonymous session;
- fetch active assessment model;
- submit/save answer progress;
- finalize complete session;
- score and persist snapshot;
- render historical result version;
- create explicit share snapshot;
- retrieve public sanitized share result;
- failure behavior for unknown/expired/invalid IDs.

### 5. End-to-end tests

Critical user path:

`landing -> start -> answer all -> navigate back/edit -> finish -> result -> optional share`

Also test:

- reload/resume;
- accidental double click/submit;
- mobile layout path;
- keyboard-only path;
- public shared-result visit;
- private/nonexistent result access;
- error recovery.

## Responsive visual QA

Automated screenshots/visual regression SHOULD cover at least:

- 320x representative mobile height;
- 375/390 mobile;
- 768 tablet;
- 1024 landscape/small desktop;
- 1280 desktop;
- 1440+ wide desktop.

Critical pages:

- landing;
- assessment first/mid/final question;
- result hero;
- long result domain;
- adversarial section;
- share card controls/public result.

## Accessibility QA

Automated scans are necessary but insufficient.

Manual release checklist:

- [ ] complete assessment without mouse/touch;
- [ ] visible focus on every interactive element;
- [ ] logical focus order;
- [ ] screen-reader labels for scale options/progress;
- [ ] selected states understandable without color;
- [ ] browser zoom/text scaling usable;
- [ ] reduced motion honored;
- [ ] no horizontal core-content scroll at 320px;
- [ ] touch targets usable on phone;
- [ ] headings/landmarks coherent.

## Privacy/security QA

Release checks:

- raw answer absent from URL/OG/public API;
- analytics network payload audit;
- session/share ID enumeration resistance;
- server-side schema validation;
- XSS/content escaping;
- rate-limit behavior;
- security headers;
- no source-map/stack/secret leakage inappropriate for production;
- dependency vulnerability scan/review;
- no AI API key/dependency required.

## Performance QA

Measure at least landing, assessment, and result pages. Investigate regressions in:

- LCP;
- INP;
- CLS;
- JS payload;
- image weight;
- server response time;
- database/query latency after persistence is introduced.

## CI gates

Current minimum CI already includes:

- TypeScript typecheck;
- Next.js production build.

Before MVP feature completion add:

- unit tests;
- deterministic golden tests;
- lint/static checks if adopted;
- E2E smoke test;
- dependency/security checks where practical.

## Bug severity

Release-blocking examples:

- same input gives different diagnostic result;
- wrong type/code due to scoring bug;
- historical result mutates after content/model update;
- answer leak in public/share/analytics path;
- assessment unusable on supported mobile width;
- keyboard cannot complete test;
- public share IDs practically enumerable;
- production build/test failure.

Editorial cosmetic issues may be non-blocking only if they do not change meaning or accessibility.
