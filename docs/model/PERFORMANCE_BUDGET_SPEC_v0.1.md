# PERFORMANCE_BUDGET_SPEC_v0.1

> Status: development release-budget contract
> Budget: `performance-budget-v0.1-dev`
> Reviewed: 2026-08-27

## Purpose

PCS previously required performance budgets without freezing measurable values. This specification separates two kinds of evidence:

1. deterministic production-build artifact budgets that can block CI now;
2. real Core Web Vitals evidence that must still be collected before Master `PCS-PERF-001` can close.

Passing the build audit is therefore necessary but not sufficient for public-launch performance approval.

## Current Core Web Vitals target

The current recorded field target follows the web.dev Core Web Vitals guidance reviewed on 2026-08-27:

| Metric | Good | Poor | Aggregation |
| --- | ---: | ---: | --- |
| LCP | ≤ 2500 ms | > 4000 ms | 75th percentile |
| INP | ≤ 200 ms | > 500 ms | 75th percentile |
| CLS | ≤ 0.1 | > 0.25 | 75th percentile |

Source: https://web.dev/articles/defining-core-web-vitals-thresholds

The thresholds are versioned in `data/performance/budgets-v0.1-dev.json`; future guidance changes require an explicit budget revision rather than silent threshold drift.

## Production artifact budgets

Current uncompressed `.next/static` limits are intentionally conservative development ceilings:

- total client JavaScript: 2,500,000 bytes;
- largest client JavaScript file: 750,000 bytes;
- total client CSS: 500,000 bytes;
- largest client CSS file: 250,000 bytes;
- total client static output: 8,000,000 bytes;
- largest individual client static file: 2,500,000 bytes;
- browser source maps: prohibited.

These limits are guardrails against accidental regressions, not claims that byte size alone predicts user experience.

## Runtime policy

Performance and privacy/security policy remain aligned:

- no runtime AI/LLM dependency;
- no browser source maps;
- third-party runtime scripts are prohibited by default unless explicitly reviewed;
- a budget increase requires a versioned review.

## CI evidence

After `next build`, `scripts/audit-performance-build.mjs` measures `.next/static`, compares every artifact budget, verifies the recorded 75th-percentile CWV target, and fails closed on budget drift.

The audit prints measurements to CI logs to provide a historical baseline.

## Remaining PCS-PERF-001 evidence

Do not mark Master `PCS-PERF-001` complete until release QA has representative evidence for landing, assessment, private result and public-share surfaces, including:

- field data when traffic/sample permits, or explicitly documented lab evidence before field data exists;
- LCP;
- INP;
- CLS;
- device/network profiles used for lab testing;
- route/scope and sample window;
- regression decision when a target is missed.

For the App Router/SPA-like navigation path, soft-navigation measurement support should be reviewed against the browser/tooling state at release time rather than assumed from full-page-load metrics.


## Dedicated representative lab harness

The repository includes a separate report-only Playwright lab workflow rather than mixing variable runtime measurements into the deterministic main CI gate.

Artifacts:

- `data/performance/lab-profile-v0.1-dev.json`;
- `playwright.performance.config.ts`;
- `tests/performance/performance-lab.spec.ts`;
- `.github/workflows/performance-lab.yml`;
- `data/performance/lab-evidence-v0.1-dev.json`.

The workflow runs both an unthrottled desktop GitHub Actions profile and a synthetic constrained mobile profile (390×844, 4× CPU slowdown, 150 ms network latency, 1.6 Mbps down / 750 kbps up). It exercises landing, assessment, completed private result and sanitized public-share surfaces.

Collected values are LCP, CLS, navigation TTFB and the largest observed Event Timing duration after representative scripted interactions. The Event Timing value is explicitly an **INP candidate/proxy**, not a field 75th-percentile INP claim.

### Frozen baseline — Performance Lab Run 1

Workflow Run `33068786639` / Performance Lab Run 1 completed successfully against commit `02cbc095e7bca33b543742a639abfe5f3d0cf48b`.

Desktop CI observations:

| Surface | LCP ms | CLS | TTFB ms | max Event Timing ms |
| --- | ---: | ---: | ---: | ---: |
| landing | 176 | 0 | 11 | 0 |
| assessment | 200 | 0.0003 | 6 | 24 |
| private result | 184 | 0 | 87 | 80 |
| public share | 128 | 0 | 41 | 0 |

Synthetic constrained-mobile observations:

| Surface | LCP ms | CLS | TTFB ms | max Event Timing ms |
| --- | ---: | ---: | ---: | ---: |
| landing | 572 | 0 | 5 | 0 |
| assessment | 940 | 0 | 6 | 32 |
| private result | 328 | 0 | 68 | 48 |
| public share | 360 | 0 | 30 | 0 |

All observed LCP and CLS values were within the recorded **good** thresholds. Interactive Event Timing maxima were below 200 ms, but they remain scripted lab proxies and MUST NOT be described as field p75 INP.

The lab output and frozen evidence both encode `master_requirement_closure=false`. Therefore this run materially advances PCS-PERF-001 but does not close it. Representative field CWV/release review remains required when traffic and the deployment environment exist.
