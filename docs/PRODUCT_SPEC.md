# Product Specification — Foundation v0.1

## 1. Goal

Create a public web personality assessment that is substantially more granular than 16-type systems while remaining understandable, reproducible, and shareable.

The product must not depend on free-form AI interpretation for its core result. The diagnostic engine, score calculation, code generation, and result modules are versioned deterministic assets.

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

A compact code intended for identity and sharing. The initial target is approximately 64 core types, but the count must be derived from a coherent set of interpretable dimensions rather than chosen only for marketing.

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

- 80–120 authored items
- approximately 4–6 items per candidate trait
- reversed / counter-keyed items where appropriate
- consistency items
- no transparent "good answer" wording

### Answer format

Default prototype: 5-point agreement scale.

Alternative response formats may be tested later if they improve discrimination without hurting completion rate.

### Reliability metadata

Results should eventually include a Profile Confidence score based on:

- within-trait consistency
- contradiction rate
- reverse-item consistency
- response timing anomalies
- straight-line answering
- missing / skipped items

Do not present this as a lie detector. It is a measurement-confidence indicator only.

## 5. Scoring model

### MVP

Versioned weighted scoring with normalized 0–100 trait values.

### Calibration stage

Evaluate:

- item-total correlation
- McDonald's omega / internal consistency
- test-retest stability
- exploratory factor analysis
- confirmatory factor analysis
- redundant trait correlations
- differential item functioning / measurement invariance where sample size permits

IRT can be considered once the data volume and item bank justify it.

## 6. Result content engine

Content must be modular and deterministic.

Example:

- `verification.high`
- `verification.low`
- `adversarial.high`
- `interaction.verification_high__adversarial_high`

The result composer selects modules based on scored traits and interactions. AI may later be used only to improve surface wording when the underlying claims and selected modules are fixed.

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
- Compatibility (later phase)

## 8. Social sharing

Initial support:

- shareable result URL
- Web Share API
- X share intent
- LINE share intent
- URL copy
- Open Graph image
- portrait share image

A result card should contain:

- Personality Code
- type name
- identity sentence
- selected headline traits
- dedicated illustration
- service mark

## 9. Data model — preliminary

Future entities:

- users
- anonymous_sessions
- assessment_models
- assessment_items
- item_revisions
- test_sessions
- answers
- trait_definitions
- trait_scores
- core_types
- personality_profiles
- content_modules
- result_snapshots
- illustrations
- share_assets

Every stored result must record the assessment model version used to create it.

## 10. Privacy principles

- Account not required to take the assessment.
- Do not collect unnecessary sensitive personal information.
- Provide explicit controls before saving a profile.
- Separate anonymous diagnostic events from account identity where practical.
- Publish a clear explanation of what is stored and why.

## 11. Product phases

### Phase 0 — Foundation

- repository and application scaffold
- visual system
- responsive public shell
- assessment UI prototype
- diagnostic specification

### Phase 1 — Measurement model

- formal trait dictionary
- trait interaction matrix
- question bank
- scoring specification
- code-generation specification

### Phase 2 — Functional MVP

- real assessment flow
- deterministic score engine
- result page
- anonymous session persistence
- model versioning

### Phase 3 — Content + illustration

- Core Type catalog
- adversarial analysis modules
- relationship modules
- work/stress modules
- dedicated illustration system

### Phase 4 — Sharing + launch analytics

- share images
- social sharing
- funnel analytics
- completion / drop-off measurement

### Phase 5 — Calibration

- reliability analysis
- item pruning
- weight revisions
- factor structure validation
- assessment model v1.0 freeze

## 12. Launch quality gates

Do not call the product "validated" until data supports that claim.

Before a broad public launch, require at minimum:

- stable scoring implementation
- repeatable model version
- no broken mobile layouts at 320px+
- keyboard-accessible assessment flow
- acceptable Core Web Vitals
- automated typechecking/build checks
- result snapshot reproducibility
- privacy / terms pages
- basic analytics and error monitoring
