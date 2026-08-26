# 01 — Product Scope Requirements

## Product objective

PCS is a public web-based personality assessment system that produces a high-resolution, reproducible personality profile from a versioned questionnaire and deterministic scoring rules.

## In scope for v1.0

- Anonymous assessment start and completion.
- Versioned question bank.
- Deterministic trait scoring.
- Core Type and Extended Code.
- Profile Confidence / response-quality metadata.
- Detailed result domains: thinking, emotion, action, relationships/love, work, stress, communication, decision making, learning, leadership, risk, creativity, hidden strengths, adversarial analysis, growth guidance.
- Curated type illustration.
- Shareable result card and explicit share controls.
- Privacy/legal pages.
- Measurement/calibration instrumentation that does not leak raw answers to third-party analytics.

## Explicitly out of scope for first functional MVP

- AI/LLM diagnosis or result generation.
- Native iOS/Android applications.
- Social feed/community.
- Direct messaging.
- Dating/matching service.
- Runtime-generated illustrations.
- Paid subscription unless separately specified.
- Compatibility scoring until a deterministic model is specified and tested.

## User journey requirements

### Landing

- **PCS-PROD-001** MUST state assessment purpose in plain language.
- **PCS-PROD-002** MUST distinguish measured tendencies from clinical diagnosis.
- **PCS-PROD-003** MUST NOT use “scientifically proven/validated” unless validation gates are met.
- **PCS-PROD-004** SHOULD show approximate item/time burden only after the real bank is frozen.

### Assessment

- **PCS-PROD-005** MUST not require account creation.
- **PCS-PROD-006** MUST show progress without pressuring the user.
- **PCS-PROD-007** MUST preserve current progress through normal navigation/reload where technically reasonable.
- **PCS-PROD-008** MUST not manipulate answers through type-preview hints or “good/bad” framing.

### Result

- **PCS-PROD-009** MUST show assessment model version.
- **PCS-PROD-010** MUST show Core Type and Extended Code only when scoring completion criteria are satisfied.
- **PCS-PROD-011** MUST distinguish measurement scores from interpretation prose.
- **PCS-PROD-012** MUST explain Profile Confidence as measurement confidence, never truthfulness/deception detection.
- **PCS-PROD-013** MUST include limitations and non-clinical disclaimer in a non-disruptive but accessible location.
- **PCS-PROD-014** SHOULD give users a “personal manual” summary suitable for practical use.

### Save/share

- **PCS-PROD-015** MUST require explicit user action before making a result shareable/persisted for public access.
- **PCS-PROD-016** MUST never put raw answer data in query parameters, URL fragments, QR payloads, or OG metadata.
- **PCS-PROD-017** MUST allow users to copy/share a result without requiring a social login.

## Success metrics

Initial product metrics:

- assessment start rate;
- completion rate;
- median completion time;
- question-level drop-off;
- result-section engagement;
- explicit share rate;
- retest completion and stability;
- item reliability/calibration metrics.

Metrics are observational and MUST NOT be used to silently modify scoring without a new model version.

## Product voice

PCS MUST be specific, calm, and conditional. It MUST avoid mystical certainty, superiority claims, shame-based weakness descriptions, and “the system knows the real you” language.
