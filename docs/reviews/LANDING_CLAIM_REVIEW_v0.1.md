# Landing Claim Review v0.1

> Status: implementation review; Master PCS-PROD-001 remains open until CI + refreshed visual baseline are green.
> Date: 2026-08-27
> Scope: `src/app/page.tsx`

## Objective

Review the public landing page against PCS-PROD-010..013 and the governance rules that prohibit premature validation, population-rarity, and finalized-64-type claims.

## Decisions

| Surface | Previous risk | Decision |
| --- | --- | --- |
| Hero purpose | Purpose was present but non-clinical boundary was implicit | State continuous tendency measurement and explicitly say this is not a medical/clinical diagnosis |
| Sample Core Code | Legacy `AVX—COS` did not match current C01D development schema | Use C01D example `SVAEND` and label it DEVELOPMENT / NON-PUBLIC |
| 64-type display | `CORE TYPE 01 / 64` could be read as a finalized taxonomy | Remove ordinal/finality presentation entirely |
| Validation status | Footer said only FOUNDATION / v0.1 | Surface DEVELOPMENT / NOT VALIDATED and state the Core schema is still under development |
| Domain wording | Some copy implied unsupported secondary conclusions | Narrow relationship/work examples to current measured/derived constructs |
| Share preview | Legacy code/name looked like approved public type content | Use current deterministic development display-name material and label the card as a development preview |
| Runtime AI claim | Existing deterministic/no-runtime-AI statement is consistent with governance | Retain |
| Population rarity | No rarity percentage is shown | Keep prohibited unless observed-distribution publication gates are later satisfied |
| Time burden | Production bank is not frozen | Do not add completion-time marketing copy yet |

## Machine guard

`scripts/validate-landing-claims.mjs` is release-blocking in normal CI and checks:

- explicit non-clinical wording;
- explicit development/non-validation status;
- current C01D non-public sample labeling;
- absence of obsolete `AVX-COS` / `AVX—COS`;
- absence of `CORE TYPE 01 / 64`;
- absence of unsupported scientific-proof, accuracy-percentage, or population-rarity presentations.

This validator is a claim-boundary guard, not psychometric evidence.

## Remaining gate

Close Master `PCS-PROD-001` only after:

1. the updated landing builds and passes responsive/accessibility E2E;
2. the intentional landing screenshots are refreshed through the controlled Visual Baseline workflow;
3. normal CI is green against the refreshed baselines.
