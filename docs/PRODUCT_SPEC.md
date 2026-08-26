# Product Specification — Foundation v0.2

> Requirement authority: `REQUIREMENTS.md` and `docs/requirements/` take precedence over this supporting product specification.

## 1. Goal

Create a public web personality assessment that is substantially more granular than 16-type systems while remaining understandable, reproducible, and shareable.

The product does not depend on AI/LLM/generative interpretation for user-facing diagnosis or results. The diagnostic engine, score calculation, code generation, result-module selection, result wording assets, and result artwork are versioned deterministic assets.

## 2. Core product promise

- Measure multiple personality traits as continuous values.
- Compress the most important patterns into a memorable Core Type.
- Preserve individual differences through an Extended Code.
- Explain both strengths and failure modes (adversarial analysis).
- Provide dedicated type artwork and social share cards.
- Work intentionally on both mobile and desktop.

## 3. Diagnostic architecture

### Layer A — Trait Vector

Internal continuous trait scores. Initial candidate domains:

- Systems Thinking
- Verification
- Adversarial Cognition
- Emotional Processing
- Boundary
- Attachment / Relational Depth
- Autonomy
- Execution
- Optimization
- Novelty Seeking
- Persistence / Finish Discipline
- Leadership
- Delegation
- Risk Orientation
- Stress Tolerance
- Creativity
- Meta-cognition
- Reciprocity / Consistency

These names are candidates until psychometric validation is complete.

### Layer B — Core Type

A compact code intended for identity and sharing. The initial exploration targets a manageable catalog (approximately 64 may be evaluated), but the final count must be derived from a coherent set of interpretable dimensions rather than chosen only for marketing.

Each Core Type eventually owns:

- code
- type name
- one-sentence identity statement
- long description
- strengths
- adversarial weaknesses
- relationship pattern
- work pattern
- stress pattern
- growth guidance
- dedicated illustration specification

### Layer C — Extended Code

Secondary traits and interaction modifiers that distinguish people who share the same Core Type.

## 4. Assessment design

### Initial item bank target

- 6–8 candidate items per retained trait before pruning
- reviewed active bank derived from calibration, not a fixed marketing question count
- reversed / counter-keyed items where appropriate
- consistency items/signals where methodologically useful
- no transparent “good answer” wording

### Answer format

Default prototype: 5-point agreement scale.

Alternative response formats may be tested later if they improve discrimination without hurting completion rate. A format/scoring-semantic change requires version review.

### Reliability metadata

Results should eventually include a Profile Confidence score based on versioned rules such as:

- within-trait consistency
- contradiction rate
- reverse-item consistency
- response timing anomalies
- straight-line answering
- missing / invalid items

Do not present this as a lie detector. It is a measurement-confidence indicator only.

## 5. Scoring model

### MVP

Versioned deterministic weighted scoring with normalized 0–100 trait values.

### Calibration stage

Evaluate:

- item-total correlation
- McDonald's omega / internal consistency
- test-retest stability
- exploratory factor analysis
- confirmatory factor analysis when sample size supports it
- redundant trait correlations
- differential item functioning / measurement invariance where sample size permits

IRT can be considered once the data volume and item bank justify it and only through an explicitly versioned model change.

## 6. Result content engine

Content is modular, authored, versioned, and deterministic.

Example module identities:

- `verification.high`
- `verification.low`
- `adversarial.high`
- `interaction.verification_high__adversarial_high`

The result composer selects modules based on scored traits and interactions using versioned precedence/conflict rules.

**Production rule:** no AI/LLM/generative model may write, rewrite, personalize, select, or alter user-facing result content at runtime. Development tools may assist drafting only when the final approved text is reviewed and committed as an ordinary versioned content asset.

## 7. Main result sections

- Core identity
- Trait overview
- Thinking
- Emotion
- Action
- Relationships / love
- Work
- Stress
- Communication
- Decision making
- Learning
- Leadership
- Risk
- Creativity
- Hidden strengths
- Adversarial analysis
- Growth constraints
- Personal manual
- Compatibility (later phase only after deterministic specification)

## 8. Social sharing

Initial support:

- explicit creation of shareable result URL/snapshot
- Web Share API
- X share intent
- LINE share intent
- URL copy
- Open Graph image
- portrait share image

A result card may contain:

- Personality Code
- type name
- identity sentence
- selected headline traits
- dedicated curated illustration
- service mark

It must not contain raw answers or private session identifiers.

## 9. Data model — preliminary

Future entities:

- users (optional account layer)
- anonymous_sessions
- assessment_models
- assessment_items
- item_revisions
- test_sessions
- answers
- trait_definitions
- trait_scores
- code_schemas/core_types
- personality_profiles/result_snapshots
- content_modules/content_versions
- illustrations/share_assets

Every stored result must record the exact assessment/code/content/asset versions needed for historical interpretation.

## 10. Privacy principles

- Account not required to take the assessment.
- Do not collect unnecessary sensitive personal information.
- Provide explicit controls before creating a public/shareable profile.
- Separate anonymous diagnostic events from account identity where practical.
- Raw answers are not embedded in public URLs/social metadata.
- Raw answers/full diagnostic profiles are not exported to ordinary third-party analytics by default.
- Publish a clear explanation of what is stored and why.

## 11. Product phases

### Phase 0 — Foundation

- repository and application scaffold
- visual system
- responsive public shell
- assessment UI prototype
- diagnostic specification
- authoritative requirements/checklist

### Phase 1 — Measurement model

- formal trait dictionary
- trait overlap/interaction matrix
- question bank
- scoring specification
- code-generation specification

### Phase 2 — Functional MVP

- real assessment flow
- deterministic score engine
- result page
- anonymous session persistence
- model/content versioning

### Phase 3 — Content + illustration

- Core Type catalog
- adversarial analysis modules
- relationship modules
- work/stress modules
- curated dedicated illustration system

### Phase 4 — Sharing + launch analytics

- share snapshots/images
- social sharing
- privacy-reviewed funnel analytics
- completion / drop-off measurement
- monitoring

### Phase 5 — Calibration

- reliability analysis
- item pruning
- weight revisions through explicit new versions
- factor structure validation
- assessment model v1.0 freeze

## 12. Launch quality gates

Do not call the product “validated” until data supports that claim.

Before broad public launch, require at minimum:

- stable deterministic scoring implementation
- repeatable/frozen model version
- historical result snapshot reproducibility
- no broken mobile layouts at 320px+
- keyboard-accessible assessment flow
- acceptable Core Web Vitals/performance review
- automated typechecking/build/test checks
- privacy / terms / limitations pages
- privacy-reviewed analytics and error monitoring
- production backup/rollback readiness
- no production AI runtime dependency

See `REQUIREMENTS.md` and `docs/requirements/11_RELEASE_OPERATIONS.md` for the authoritative launch checklist.
