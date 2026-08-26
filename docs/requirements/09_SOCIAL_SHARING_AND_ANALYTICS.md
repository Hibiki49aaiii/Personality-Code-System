# 09 — Social Sharing and Analytics Requirements

## Sharing principle

Sharing is a deliberate export of a sanitized result identity, not automatic publication of assessment data.

## Share methods

Initial supported methods SHOULD include:

- Web Share API where supported;
- X share intent;
- LINE share intent;
- copy result URL;
- downloadable/shareable portrait result image where implementation allows;
- Open Graph metadata/image for explicit public share URLs.

No social-account OAuth is required for MVP sharing.

## Share snapshot

A shareable result MUST be derived from an immutable sanitized result snapshot and MAY include:

- Personality Code;
- Core Type name;
- one identity sentence;
- selected headline traits/categories;
- observed rarity/sample statistic only when policy permits;
- curated type illustration;
- PCS brand/service mark;
- model/version indication when visually practical.

It MUST NOT include:

- raw item answers;
- session token;
- email/account identifier;
- confidence internals that could be misread as deception score;
- sensitive analytics identifiers.

## Share creation flow

- User finishes result privately.
- User explicitly selects share/save-public action.
- Server creates or activates an opaque public snapshot ID.
- Share UI uses that URL/snapshot.
- Reopening the URL MUST not re-score against the newest model/content.

If public-link revocation is implemented, revoked links must stop serving the public snapshot after reasonable cache invalidation.

## Open Graph image

OG/social images MUST be deterministic for a given result snapshot + asset/template version.

Template requirements:

- stable dimensions suitable for major social previews;
- safe text margins;
- readable type/code at preview size;
- curated illustration only;
- fallback if illustration asset unavailable;
- Japanese glyph/font handling verified;
- no dependence on runtime AI/image generation.

## Portrait share image

The mobile/portrait card SHOULD be optimized for posting/saving to social platforms and SHOULD include enough identity to be understandable outside the site.

It must not become a screenshot of the entire long result page.

## Analytics events

Initial first-party/product events:

- landing viewed;
- assessment started;
- question viewed (position/item opaque internal ID where appropriate);
- answer interaction count/state without exporting answer value to third-party analytics;
- assessment resumed;
- assessment completed;
- result viewed;
- result domain expanded/viewed if used;
- share initiated;
- share method selected;
- share snapshot created;
- client/server error category;
- performance measurements.

## Analytics payload rules

Third-party analytics SHOULD receive the minimum properties needed for funnel/product analysis.

Do not send by default:

- raw answer value;
- complete trait vector;
- detailed result prose;
- free-form user input;
- directly identifying diagnostic payload.

If a Core Type is ever used as an analytics dimension, privacy impact must be reviewed first and aggregation thresholds should be considered.

## Calibration telemetry

Psychometric calibration is not ordinary analytics.

A first-party calibration pipeline MAY store:

- anonymized/pseudonymous answer sets;
- model/item versions;
- response timings needed for quality analysis;
- retest linkage via privacy-preserving mechanism;
- optional separately consented demographics.

Calibration exports MUST remove unnecessary operational/account identifiers.

## Rarity statistics

Displayed rarity/distribution MUST be computed from valid stored assessments under an explicit scope.

Every statistic MUST carry enough metadata to produce wording such as:

> “1.7% of 128,420 valid Japanese PCS v1.0 assessments completed from DATE to DATE.”

Prohibited:

- “only 0.1% of humanity” based solely on theoretical trait multiplication;
- silently mixing incompatible model versions;
- hiding sample size when presenting precise percentages;
- using invalid/abandoned assessments in the denominator.

## Analytics acceptance checklist

- [ ] event dictionary documented;
- [ ] no raw answers visible in third-party analytics network payloads;
- [ ] consent behavior matches legal/privacy implementation;
- [ ] staging/test traffic separable from production;
- [ ] model version attached to assessment funnel/calibration events where needed;
- [ ] retention settings documented;
- [ ] share funnel test passes without social login.
