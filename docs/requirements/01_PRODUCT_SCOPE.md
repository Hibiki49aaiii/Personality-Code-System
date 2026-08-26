# 01 — Product Scope Requirements

## Product objective

PCS is a public web-based personality assessment system that produces a high-resolution, reproducible personality profile from a versioned questionnaire and deterministic scoring rules.

## Master-ID reservation

`REQUIREMENTS.md` owns the top-level **PCS-PROD-001..008** meanings. This derivative file MUST NOT redefine those IDs. Detailed user-journey clauses use grouped ranges beginning at **PCS-PROD-010**.

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

- **PCS-PROD-010** MUST state assessment purpose in plain language.
- **PCS-PROD-011** MUST distinguish measured tendencies from clinical diagnosis.
- **PCS-PROD-012** MUST NOT use “scientifically proven/validated” unless validation gates are met.
- **PCS-PROD-013** SHOULD show approximate item/time burden only after the real bank is frozen.

### Assessment

- **PCS-PROD-020** MUST not require account creation.
- **PCS-PROD-021** MUST show progress without pressuring the user.
- **PCS-PROD-022** MUST preserve current progress through normal navigation/reload where technically reasonable.
- **PCS-PROD-023** MUST not manipulate answers through type-preview hints or “good/bad” framing.

Current Phase 2C implementation satisfies the anonymous-start, progress, save/resume/back/edit and no-type-preview parts of this assessment flow against the reviewed 147-item development model. Production model calibration remains a later gate.

### Result

- **PCS-PROD-030** MUST show assessment model version.
- **PCS-PROD-031** MUST show Core Type and Extended Code only when scoring completion criteria are satisfied.
- **PCS-PROD-032** MUST distinguish measurement scores from interpretation prose.
- **PCS-PROD-033** MUST explain Profile Confidence as measurement confidence, never truthfulness/deception detection.
- **PCS-PROD-034** MUST include limitations and non-clinical disclaimer in a non-disruptive but accessible location.
- **PCS-PROD-035** SHOULD give users a “personal manual” summary suitable for practical use.

Current Phase 2C result renders deterministic Core/Extended Code, 21 Trait scores, response-quality metadata, version metadata and all 18 structured result domains. Final public type names/copy/illustrations remain Phase 3/5 work.

### Save/share

- **PCS-PROD-040** MUST require explicit user action before making a result shareable/persisted for public access.
- **PCS-PROD-041** MUST never put raw answer data in query parameters, URL fragments, QR payloads, or OG metadata.
- **PCS-PROD-042** MUST allow users to copy/share a result without requiring a social login.

Public sharing is intentionally not implemented in Phase 2C. Private completion alone creates no public result URL.

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
