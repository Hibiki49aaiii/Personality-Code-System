# Item Bank v0.2 — Complete Wording Review

> Status: reviewed candidate bank; not yet beta-calibrated
> Locale: ja-JP
> Review date: 2026-08-26
> Base: item-bank-v0.1
> Trait dictionary: v0.2

## 1. Review result

All 147 candidate items received exactly one recorded disposition in `data/item-bank/v0.2/review.json`.

- `accept-r1`: **98**
- `revise-r2`: **39**
- `hold-for-beta`: **10**
- `reject`: **0**

The review is a wording/construct-purity pass, not empirical validation. Items marked `hold-for-beta` remain in the reviewed candidate bank specifically because their behavior must be resolved using beta response data rather than reviewer intuition alone.

## 2. What was reviewed

Every item was checked against the ten dimensions defined in the v0.1 review plan:

1. single proposition / no double-barrel;
2. primary-trait purity;
3. social-desirability asymmetry;
4. specialist-context independence;
5. broad adult applicability;
6. reverse wording clarity;
7. neighboring-trait contamination;
8. Japanese/localization clarity;
9. expected response spread;
10. whether both poles have a plausible non-pathological interpretation.

## 3. Versioning method

`item-bank-v0.1` is never overwritten.

`item-bank-v0.2` is defined as:

`immutable v0.1 snapshot + immutable review ledger -> reviewed v0.2 materialization`

Rules:

- accepted items keep revision `r1`;
- semantic wording changes become `r2`;
- all reviewed materialized records receive lifecycle `reviewed`;
- `primary_trait`, `direction`, `weight`, ID, and item ordering are inherited unchanged from v0.1;
- held items are reviewed but carry `hold-for-beta` metadata;
- CI must prove complete one-and-only-one review coverage.

## 4. Revised items — 39

### SYS
- `PCS-SYS-004` — removed responsibility/boundary contamination; now focuses on dependency structure.
- `PCS-SYS-006` — removed "easier" preference wording.

### VER
- `PCS-VER-007` — low pole no longer sounds irrational by ignoring an explicit contradiction.

### ADV
- `PCS-ADV-002` — separated failure scanning from loophole scanning.
- `PCS-ADV-007` — clarified latent-interest scanning without presuming dishonesty.

### ABS
- `PCS-ABS-002` — removed memory-strategy contamination.
- `PCS-ABS-007` — changed self-rated ability wording into behavioral tendency.

### META
- `PCS-META-003` — changed self-rated explanatory ability into actual reflection behavior.
- `PCS-META-007` — reduced a confidence-plus-assumptions double proposition.

### EMO
- `PCS-EMO-004` — removed verbalization requirement to separate EMO from COG.
- `PCS-EMO-007` — clarified delayed emotional access after problem analysis.

### COG
- `PCS-COG-004` — removed problem-solving/EXE drift; now measures cognitive organization of emotion.

### BND
- `PCS-BND-001` — removed presupposition that the request is objectively unnecessary.
- `PCS-BND-003` — removed value-laden "unreasonable request / necessary boundary" framing.
- `PCS-BND-007` — replaced abstract responsibility philosophy with porous-boundary behavior.

### RDP
- `PCS-RDP-001` — reduced network-size proxy.
- `PCS-RDP-004` — removed rumination contamination.
- `PCS-RDP-006` — reduced network breadth proxy and focused on disclosure depth.

### REC
- `PCS-REC-002` — removed reassurance/attachment-loaded wording.
- `PCS-REC-003` — reduced extreme one-sided moral framing.
- `PCS-REC-004` — converted abstract mutual-choice language to observable relationship-maintenance behavior.
- `PCS-REC-007` — removed implication that reciprocity requires equal magnitude.

### CON
- `PCS-CON-002` — removed accusatory "conveniently changes rules" wording.
- `PCS-CON-003` — removed explicit re-verification behavior that loaded on VER.
- `PCS-CON-005` — changed a general philosophy statement into respondent tendency.

### AUT
- `PCS-AUT-003` — replaced VER-like rule checking with direct decision ownership.
- `PCS-AUT-007` — removed "unreasonable procedure" framing from the low-autonomy pole.

### OPT
- `PCS-OPT-003` — added opportunity-cost pressure; high OPT is no longer framed as obviously rational quality improvement.

### FIN
- `PCS-FIN-003` — improved natural Japanese wording for closure.
- `PCS-FIN-004` — changed self-rated ability into actual scope-cut behavior.

### NOV
- `PCS-NOV-001` — removed judgmental "more than necessary" wording.

### PER
- `PCS-PER-003` — removed pace-management implication and focused on persistence through boring middle work.

### RSK
- `PCS-RSK-004` — clarified variance preference.

### UNC
- `PCS-UNC-002` — removed EXE-heavy action framing.
- `PCS-UNC-004` — changed capability wording into decision tendency.
- `PCS-UNC-007` — removed explanation/CON contamination and focused on closure difficulty.

### STR
- `PCS-STR-003` — removed META-dependent "required reflection" condition.

### CRE
- `PCS-CRE-003` — changed liking statement into recombination behavior.
- `PCS-CRE-005` — removed "feels safer" wording that could load on RSK/UNC.

## 5. Hold-for-beta items — 10

These items passed basic wording review but retain a construct-contamination risk that should be resolved empirically:

- `PCS-VER-002` — META / socially desirable bias-monitoring overlap.
- `PCS-BND-004` — work-role context and AUT overlap.
- `PCS-RDP-003` — exclusivity/REC overlap.
- `PCS-REC-006` — response-frequency changes have many external causes.
- `PCS-AUT-004` — motivation is not determined by autonomy alone.
- `PCS-EXE-004` — reversible action may load on UNC.
- `PCS-NOV-006` — predictability preference may load on UNC.
- `PCS-PER-007` — external accountability may measure structure dependence.
- `PCS-UNC-005` — attentional interference may load on stress/rumination.
- `PCS-STR-006` — continued thinking may load on COG/META/CON.

A hold is not a rejection. Beta statistics determine keep/revise/retire decisions.

## 6. Review invariants

The wording review intentionally does **not** change:

- trait membership;
- positive/reverse key direction;
- item weight;
- five-point response mapping;
- number of items per trait;
- 4 positive / 3 reverse balance;
- high-overlap discriminant tags.

This separation prevents editorial review from silently modifying the scoring model.

## 7. Remaining evidence requirements

Before any item is promoted from `reviewed` to `beta`/`active`, evaluate at minimum:

- response distribution and floor/ceiling effects;
- item-total relationship within intended trait;
- cross-trait loading/correlation, especially tagged overlap pairs;
- reverse-item method effects;
- completion/drop-off by item position;
- test-retest behavior where sample permits;
- ambiguity feedback;
- demographic/language DIF/invariance when sample size permits.

The reviewed bank is suitable for the next engineering/code-schema stage and later closed beta. It is not evidence that the 21-trait model is scientifically validated.
