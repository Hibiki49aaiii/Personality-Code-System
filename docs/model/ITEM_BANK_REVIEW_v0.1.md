# Item Bank v0.1 — Authoring and Review Record

> Status: candidate bank / draft lifecycle
> Locale: ja-JP
> Date: 2026-08-26
> Trait dictionary: v0.2

## 1. Inventory

- 21 retained direct traits.
- 7 candidate items per trait.
- 147 total candidate items.
- Per trait: 4 positive-keyed + 3 reverse-keyed items.
- Initial weight: 1.0 for all items.
- Lifecycle: `draft` for all items until a dedicated wording/reviewer pass is completed.
- Five-point agreement response scale is defined in `data/item-bank/v0.1/manifest.json`.

## 2. File layout

- `data/item-bank/v0.1/manifest.json`
- `data/item-bank/v0.1/cognitive.json` — SYS, VER, ADV, ABS, META
- `data/item-bank/v0.1/affect-relational.json` — EMO, COG, BND, RDP, REC, CON, AUT
- `data/item-bank/v0.1/action-risk.json` — EXE, OPT, FIN, NOV, PER, RSK, UNC
- `data/item-bank/v0.1/resilience-creativity.json` — STR, CRE

## 3. High-overlap discriminant coverage

Each high-risk conceptual pair has explicit discriminant items in both directions:

- VER ↔ ADV — evidence checking vs failure/hostile-condition scanning.
- EMO ↔ COG — direct emotional access vs cognitive mediation of emotion.
- OPT ↔ FIN — improvement pressure vs stopping/closure discipline.
- RSK ↔ UNC — downside acceptance vs incomplete-information tolerance.

CI validation requires at least two explicitly tagged discriminant items on each side of every high-overlap pair.

## 4. Authoring controls already applied

- One primary scoring trait per item.
- No item directly exposes trait codes/type labels to respondents.
- No clinical diagnosis wording.
- No AI/technology-specific knowledge required.
- Reverse items use natural opposite propositions rather than confusing double negation.
- Most items describe behavior/preference rather than self-praise labels such as “論理的だ” or “創造的だ”.
- RSK items explicitly include downside/variance to separate risk appetite from UNC.
- EMO items focus on recognition/differentiation timing; COG items focus on processing route.
- FIN items focus on stopping/closing; OPT items focus on further improvement.
- VER items can be endorsed without hostile assumptions; ADV items can be endorsed without source-check behavior.

## 5. Known review risks before `reviewed` lifecycle

The following need a deliberate second wording pass and later beta evidence; they are not reasons to discard the current candidate bank.

### Social-desirability risk

Possible in VER, META, BND, EXE, PER and STR because some behaviors can sound culturally “competent”. The second review should create/retain items where either pole has a credible benefit/tradeoff and inspect skew during beta.

### Context dependence

- BND/AUT items span work and personal contexts and may behave differently by respondent role.
- RDP/REC are intentionally relationship-heavy; ensure respondents without a current romantic partner can answer from close relationships generally.
- RSK must remain cross-domain; beta revisions should avoid becoming a finance/entrepreneurship proxy.
- STR is non-clinical and should not use trauma/medical inference.

### Neighbor contamination

Tagged `discriminates` metadata is a warning, not proof of discriminant validity. Particular watch pairs are recorded in the overlap matrix.

### Acquiescence / reverse-item method effects

The 4/3 direction balance protects against simple one-direction response tendencies, but reverse wording itself can create method factors. Empirical review must test whether reverse items behave differently for linguistic reasons.

## 6. Requirement status

- **PCS-SCORE-001:** satisfied — 7 candidates exist for each of 21 retained traits.
- **PCS-SCORE-002:** not yet satisfied — this authoring pass includes safeguards, but a separate complete wording/review pass and recorded dispositions are still required before changing lifecycle to `reviewed`.
- **PCS-SCORE-003:** partially satisfied — immutable IDs/revisions/metadata are defined, but the formal item-version release procedure and active scoring model are not yet frozen.

## 7. Next review pass

For each of 147 items, record one disposition:

- `accept-r1`
- `revise-r2`
- `reject`
- `hold-for-beta`

Review dimensions:

1. single proposition / no double-barrel;
2. primary-trait purity;
3. low social-desirability asymmetry;
4. understandable without specialist context;
5. applicable to broad adult respondents;
6. reverse wording clarity;
7. neighboring-trait contamination;
8. translation/localization risk;
9. expected response spread;
10. whether an opposite-pole respondent has a plausible non-pathological reason to disagree.

Only after that pass should candidate items move from `draft` to `reviewed`.