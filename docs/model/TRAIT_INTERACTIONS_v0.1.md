# Trait Interaction Rules v0.1

> Status: versioned hypotheses for deterministic result composition
> Date: 2026-08-26
> Requires: Trait Dictionary v0.2

## 0. Rule philosophy

An interaction exists only when the combination explains behavior more precisely than two independent trait paragraphs. Interactions are **not additional scores** and must not inflate rarity claims.

Provisional normalized bands for the item-bank prototype:

- very low: 0–19
- low: 20–34
- mid: 35–65
- high: 66–80
- very high: 81–100

These boundaries are deterministic placeholders and may change with a new scoring/model version after calibration. Published snapshots retain the boundaries used at diagnosis time.

Every rule has an evidence status. All rules below are `hypothesis` until beta data support them.

## 1. Precedence

Result composition priority, highest first:

1. explicit safety/limitation copy;
2. multi-trait interaction module;
3. Core Type integrated module;
4. single-trait extreme module;
5. single-trait general module.

A higher-priority module may suppress a lower-priority statement only when the rule explicitly lists the suppressed claim/module family.

## 2. Interaction register

### PCS-INT-001 — Forensic Verification

- **Condition:** VER >= 66 AND ADV >= 66
- **Interpretation:** Evidence checking is paired with active search for failure, contradiction, incentives, or exploit paths. The person is not merely cautious; verification is threat/failure-aware.
- **Primary domains:** Thinking, Work, Risk, Adversarial Analysis
- **Suppress/modify:** Do not render generic VER copy implying verification is only accuracy-seeking; do not render ADV copy implying threat scanning occurs without evidence checks.
- **Evidence:** hypothesis

### PCS-INT-002 — Precision Verification

- **Condition:** VER >= 66 AND ADV <= 34
- **Interpretation:** High evidence standards are present without strong hostile/failure orientation. Verification is more likely driven by accuracy, correctness, or confidence calibration than by threat scanning.
- **Primary domains:** Thinking, Decision Making
- **Suppress/modify:** Suppress any inference that high VER means suspiciousness.
- **Evidence:** hypothesis

### PCS-INT-003 — Structural Abstraction

- **Condition:** SYS >= 66 AND ABS >= 66
- **Interpretation:** The person tends to both map interacting parts and compress cases into reusable models, supporting architecture/framework-building behavior.
- **Primary domains:** Thinking, Learning, Hidden Strengths
- **Suppress/modify:** Avoid treating SYS as purely concrete dependency tracking or ABS as detached theory.
- **Evidence:** hypothesis

### PCS-INT-004 — Systems Recombination

- **Condition:** SYS >= 66 AND CRE >= 66
- **Interpretation:** Novel combinations are likely to be generated with awareness of dependencies and system effects rather than as isolated ideas.
- **Primary domains:** Creativity, Work, Hidden Strengths
- **Suppress/modify:** Soften generic high-CRE warning that novelty is necessarily unstructured.
- **Evidence:** hypothesis

### PCS-INT-005 — Analytical Emotional Distance

- **Condition:** COG >= 66 AND META >= 66 AND EMO <= 34
- **Interpretation:** The person may produce sophisticated explanations of emotional situations while direct access to the primary feeling arrives later. This is a processing-style hypothesis, not a pathology claim.
- **Primary domains:** Emotion, Relationships/Love, Communication, Growth
- **Suppress/modify:** Suppress any generic statement equating articulate emotional analysis with high emotional access.
- **Evidence:** hypothesis

### PCS-INT-006 — Dual-Channel Emotional Processing

- **Condition:** EMO >= 66 AND COG >= 66
- **Interpretation:** Direct feeling recognition and analytical processing can occur together; the person may both name emotion and model its causes/implications quickly.
- **Primary domains:** Emotion, Communication, Relationships/Love
- **Suppress/modify:** Suppress any claim that high COG necessarily implies emotional distance.
- **Evidence:** hypothesis

### PCS-INT-007 — Deep but Non-Fused Bonding

- **Condition:** RDP >= 66 AND BND >= 66
- **Interpretation:** Strong preference for deep/selective relationships coexists with clear autonomy/obligation boundaries. Intimacy is not equivalent to relational fusion.
- **Primary domains:** Relationships/Love
- **Suppress/modify:** Suppress generic high-RDP language implying dependency or constant togetherness.
- **Evidence:** hypothesis

### PCS-INT-008 — Relational Audit Sensitivity

- **Condition:** RDP >= 66 AND REC >= 66 AND CON >= 66
- **Interpretation:** Deep relationship investment combines with strong monitoring of mutual effort and behavioral consistency; relational changes are likely to receive high cognitive attention.
- **Primary domains:** Relationships/Love, Communication, Adversarial Analysis
- **Suppress/modify:** Replace separate repetitive warnings from REC/CON with one integrated module.
- **Evidence:** hypothesis

### PCS-INT-009 — Strong Self-Governance

- **Condition:** AUT >= 66 AND BND >= 66
- **Interpretation:** The person both wants decision discretion and actively separates voluntary support from externally imposed obligation.
- **Primary domains:** Work, Relationships/Love, Growth
- **Suppress/modify:** Avoid interpreting either trait alone as simple rebelliousness/selfishness.
- **Evidence:** hypothesis

### PCS-INT-010 — Delegation Friction Profile

- **Condition:** AUT >= 66 AND VER >= 66 AND CON >= 66
- **Interpretation:** High ownership need, verification threshold, and consistency sensitivity may make transferring responsibility difficult unless review standards/interfaces are explicit.
- **Primary domains:** Work, Leadership-derived profile
- **Suppress/modify:** This must not be presented as a measured DEL score or as inability to delegate.
- **Evidence:** hypothesis

### PCS-INT-011 — Endless Optimization Loop

- **Condition:** OPT >= 66 AND FIN <= 34
- **Interpretation:** Improvement opportunities remain highly salient while stopping/closure pressure is weak; near-finished work may remain open because remaining gains are visible.
- **Primary domains:** Action, Work, Adversarial Analysis, Growth
- **Suppress/modify:** Replace generic "perfectionist" wording; do not infer high quality automatically.
- **Evidence:** hypothesis

### PCS-INT-012 — Disciplined Optimizer

- **Condition:** OPT >= 66 AND FIN >= 66
- **Interpretation:** Strong improvement drive is bounded by explicit completion rules; the person may optimize intensively but still ship/close.
- **Primary domains:** Action, Work, Hidden Strengths
- **Suppress/modify:** Suppress high-OPT failure-mode copy that assumes endless revision.
- **Evidence:** hypothesis

### PCS-INT-013 — Exploration Drop-Off

- **Condition:** NOV >= 66 AND PER <= 34
- **Interpretation:** New domains/projects strongly attract attention, while sustained effort after novelty declines is comparatively weak.
- **Primary domains:** Action, Work, Growth
- **Suppress/modify:** Do not label as laziness; distinguish interest-dependent persistence.
- **Evidence:** hypothesis

### PCS-INT-014 — Sustained Explorer

- **Condition:** NOV >= 66 AND PER >= 66
- **Interpretation:** The person seeks novelty but can continue through the less stimulating middle phase, supporting long-form exploration rather than serial starts only.
- **Primary domains:** Learning, Work, Hidden Strengths
- **Suppress/modify:** Suppress generic high-NOV copy implying likely abandonment after novelty fades.
- **Evidence:** hypothesis

### PCS-INT-015 — Decisive Under Ambiguity

- **Condition:** EXE >= 66 AND UNC >= 66
- **Interpretation:** The person can initiate action without full information and revise while moving, especially on reversible decisions.
- **Primary domains:** Decision Making, Work, Action
- **Suppress/modify:** Do not infer high risk appetite unless RSK is also high.
- **Evidence:** hypothesis

### PCS-INT-016 — Verification Stall Risk

- **Condition:** VER >= 66 AND UNC <= 34 AND EXE <= 34
- **Interpretation:** High evidence requirements, low ambiguity tolerance, and slow initiation may combine into continued checking after a viable next step exists.
- **Primary domains:** Decision Making, Growth, Adversarial Analysis
- **Suppress/modify:** Replace separate repetitive warnings from VER/UNC/EXE.
- **Evidence:** hypothesis

### PCS-INT-017 — Uncertain-Risk Acceptance

- **Condition:** RSK >= 66 AND UNC >= 66
- **Interpretation:** The person tolerates both downside variance and incomplete information, enabling action in genuinely uncertain opportunities but increasing the importance of external guardrails/tail-risk checks.
- **Primary domains:** Risk, Decision Making
- **Suppress/modify:** Do not describe this as good risk calibration.
- **Evidence:** hypothesis

### PCS-INT-018 — Ambiguity-Tolerant Conservatism

- **Condition:** UNC >= 66 AND RSK <= 34
- **Interpretation:** The person can live with unresolved information while still preferring to protect against downside. Ambiguity tolerance should not be mistaken for risk-seeking.
- **Primary domains:** Risk, Decision Making
- **Suppress/modify:** Suppress any generic UNC wording implying adventurousness.
- **Evidence:** hypothesis

### PCS-INT-019 — Coherence/Closure Pressure

- **Condition:** CON >= 66 AND UNC <= 34
- **Interpretation:** Contradictions are highly salient and unresolved explanations are uncomfortable, creating strong pressure to reconcile events/statements before moving on.
- **Primary domains:** Relationships/Love, Stress, Communication
- **Suppress/modify:** Do not infer deception by the other person/system solely from this profile.
- **Evidence:** hypothesis

### PCS-INT-020 — Ideation Proliferation

- **Condition:** CRE >= 66 AND NOV >= 66 AND FIN <= 34
- **Interpretation:** Many novel combinations and new directions may be generated faster than they are closed/selected, producing breadth of ideas with open-loop risk.
- **Primary domains:** Creativity, Work, Growth
- **Suppress/modify:** Do not equate idea volume with realized innovation.
- **Evidence:** hypothesis

## 3. Derived profiles allowed in v0.2

Derived profiles are narrative interpretations only. They must not display a 0–100 score unless later directly measured and validated.

- **Leadership Structure profile:** AUT + BND + EXE + CON + OPT + VER + STR interactions.
- **Delegation Friction/Transfer profile:** AUT + VER + CON + BND plus context disclaimers.
- **Cross-domain Transfer profile:** ABS + CRE + SYS, optionally META for self-aware transfer checking.

## 4. Contradiction guard examples

- If `PCS-INT-012` (Disciplined Optimizer) fires, suppress generic copy "you may never know when to stop" from OPT unless FIN itself is low (which would make the interaction impossible).
- If `PCS-INT-007` fires, do not call high RDP "dependent" or imply weak boundaries.
- If `PCS-INT-006` fires, do not infer intellectualization solely from high COG.
- If `PCS-INT-018` fires, do not infer high risk appetite from high UNC.
- If `PCS-INT-002` fires, do not infer suspicion from high VER.

## 5. Version rule

Changing a condition threshold, interpretation claim, suppression behavior, or trait membership changes the interaction-rule version. Results persist the exact interaction set/version used to compose the snapshot.