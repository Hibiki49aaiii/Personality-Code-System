# BETA_CALIBRATION_PROTOCOL_v0.1

> Status: planning-only / Wave JA-01 registration-ready candidate / no calibration collection enabled
> Protocol: `beta-calibration-protocol-v0.1-dev`
> Locale scope: `ja-JP`
> Date: 2026-08-27

## Purpose

Define the evidence and governance PCS needs **before** closed-beta psychometric collection begins. The goal is to prevent the beta dataset from becoming an improvised source of post-hoc thresholds, silent item changes, or premature validation claims.

This protocol does not activate collection and does not authorize raw-answer export.

## Activation boundary

Phase 5A collection cannot start until all of the following exist and are reviewed together:

1. explicit calibration participation/consent state separate from ordinary assessment completion;
2. versioned consent-purpose text;
3. legal/privacy approval for the deployed jurisdiction;
4. development/preview/production environment separation;
5. retention/deletion behavior for calibration records;
6. operator authorization and export/audit controls;
7. a pre-registered sample-size/analysis plan;
8. frozen assessment/item/scoring/version scope for the collection wave.

Until then, `collection_enabled=false` and `export_enabled=false` are machine-enforced.

### Consent persistence foundation

The repository now contains a **storage-only** consent receipt foundation without activating collection:

- `data/calibration/consent-purpose-v0.1-dev.json` defines one versioned draft purpose/consent identity and explicitly keeps legal/collection/export authorization false;
- `calibration_consent_receipts` stores only purpose/version/model/locale/status/timestamps;
- `calibration_records` / `calibration_item_responses` define the future purpose-separated answer-storage shape with exact Wave JA-01/model/item constraints, while no runtime role/API can ingest rows;
- the receipt is bound by PostgreSQL trigger to the owning session's exact model + locale;
- receipt identity is immutable; the only supported update is `granted -> withdrawn`;
- owner-session deletion cascades the receipt;
- the normal application runtime database role has **zero SELECT/INSERT/UPDATE/DELETE privileges** on the table before activation;
- no `/api/calibration` runtime route, no calibration ingest role/path and no calibration export job exist.

This completes engineering groundwork for a future explicit consent state while deliberately refusing to collect anything yet.

### Retention / operator governance foundation

The repository now contains a calibration governance contract plus a **fail-closed operator-plane persistence foundation**:

- `data/calibration/governance-policy-v0.1-dev.json`;
- `docs/model/CALIBRATION_GOVERNANCE_POLICY_v0.1.md`;
- `scripts/validate-calibration-governance.mjs`.

Current engineering decisions:
- future row-level calibration artifacts are capped at 180 days after wave close;
- withdrawal/self-deletion overrides time-based retention;
- withdrawn records must be purged/regenerated before further analysis;
- raw export requires requester + different approver;
- operator audit metadata uses a bounded allowlist and must not contain raw diagnostic/participant payload;
- operator audit metadata uses a 365-day engineering baseline.

Repository persistence implements hash-only operator identities, explicit role bindings, two-person export-request state, append-only bounded audit storage, pseudonymous calibration-record links and withdrawal/session-deletion events. Offline operator issuance/authentication/role-management/revocation plus request/review/approve/reject control tooling is implemented. `pcs_calibration_auth` and `pcs_calibration_export_control` are execute-only with zero direct table privileges; `pcs_calibration_admin` remains narrowly writable for credential/role lifecycle. The ordinary application runtime role still has zero privileges on all calibration operator-plane tables.

The remaining operator-plane blockers are production operator provisioning evidence and raw export materialization/artifact handling. Request/approval control and two-person row-level privacy purge are repository-implemented; artifact purge/regeneration remains a mandatory future-materializer coupling. Collection/export therefore stay disabled. The 180/365-day values are engineering baselines, not final legal promises.

## Version scope

Every beta wave must identify the exact:

- assessment model version;
- item bank version;
- scoring version;
- Trait Dictionary version;
- locale.

Data from incompatible versions must not be silently pooled for confirmatory claims.

## Wave JA-01 registration-ready candidate

The machine-readable Wave JA-01 plan is no longer an empty template. It now freezes the **candidate decisions** required for external preregistration review while deliberately keeping all activation flags false.

Candidate decisions and exact repository scope include:
- adult Japanese-reading volunteer population and non-probability recruitment boundary;
- exact `assessment-dev-v0.3` / item-bank / scoring / Trait Dictionary / locale tuple;
- N=1000 target, N=800 primary structural-bundle minimum and a result-independent 56-day stop rule;
- deterministic 70/30 development/holdout split from the random calibration record ID hash;
- narrow primary exclusions plus response-style sensitivity analyses rather than ad-hoc deletion;
- 14–21 day retest, target N=200 and low-precision downgrade below N=150;
- ordinal/polychoric structural analysis, omega/ICC and pre-specified review triggers;
- no Wave 01 demographic/DIF inference because the current export schema deliberately contains no demographic fields.

This state is **registration-ready, not preregistered**. The external registration reference remains null. The repository candidate version scope is now frozen by `data/calibration/beta-wave-ja-01-scope-freeze-v0.1-dev.json` using ordered SHA-256 file identities; collection/export remain disabled.

## Planned analysis bundle

### Item behavior

Review:

- response distributions;
- floor/ceiling concentration;
- pathological skew;
- missing/invalid patterns;
- item-total and scale behavior;
- candidate redundancy.

### Reliability

Primary internal-consistency review uses McDonald's omega where appropriate; alpha may be supplementary. No single coefficient is a pass/fail oracle.

### Trait overlap and structure

Review:

- inter-Trait correlations;
- nearest-neighbor/discriminant behavior;
- exploratory factor structure;
- held-out/confirmatory structural review when the sample supports it;
- whether a Trait should be narrowed, merged, or removed even if doing so changes the desired marketing type count.

### Retest

Wave JA-01 retains the preregistration candidate:
- 14–21 day interval;
- target completed retests: 200;
- low-precision/descriptive downgrade below N=150;
- exact same frozen Wave/model scope.

The repository now implements the **fail-closed linkage foundation**:
- `calibration_retest_linkages` pairs one completed baseline `calibration_record` with at most one completed retest record;
- baseline/retest timing is derived from `calibration_records.completed_at`, not from a diagnostic session capability;
- one-time retest claim credentials are 32-byte base64url values whose database identity is SHA-256 only;
- baseline and retest use distinct purpose-specific consent identities;
- either linked consent withdrawal invalidates the pair and journals both pseudonymous calibration record IDs for a future purge executor;
- the candidate retest export schema `calibration-export-record-v0.2-retest-dev` adds only `measurementOccasion` and random `retestPairId` beyond the minimum answer-level shape.

This does **not** activate retest participation. There is still no runtime issue/claim endpoint, reminder/contact service, raw materializer, final retest consent approval or collected retest cohort.


## Sample-size rule

The protocol intentionally contains **no universal numeric minimum N**.

Before activation, each wave analysis plan must justify sample size against:

- item/model dimensionality;
- precision/uncertainty targets;
- planned factor analysis complexity;
- expected retest attrition;
- any subgroup/DIF scope.

Wave JA-01 now has a registration-ready **wave-specific** candidate:
- target eligible complete baseline N = 1000;
- minimum N = 800 for the planned primary structural bundle;
- stop at N=1000 eligible completes or 56 days after activation, whichever comes first;
- N<800 downgrades the wave to pilot/descriptive evidence rather than silently relaxing the confirmation plan.

These values are operational preregistration decisions for the 147-item/21-Trait candidate and deterministic holdout design. They are not a general participants-per-item rule and do not override model convergence, uncertainty, communalities, holdout adequacy or limitations.

The justification must be written before using the final confirmation dataset where practical.

Human-readable candidate:
`docs/model/BETA_WAVE_JA_01_PREREGISTRATION_DRAFT.md`.

## Model-change ledger

Every beta-driven item or scoring change must record:

- old version;
- new version;
- changed item/weight/rule;
- evidence that triggered review;
- editorial/measurement rationale;
- impact on historical reproducibility;
- whether prior beta data remain comparable.

A beta wave does not mutate an already published/frozen model in place.

## Promotion boundary

Stage promotion is evidence-bundle based.

No single omega, alpha, factor-fit index, p-value, completion metric, or type-frequency statistic may promote the model by itself.

A stable-model review requires the outputs already listed in `VALIDATION_GATES_v0.1.md`, including reliability, retest, structural, overlap/discriminant, change-ledger, version-scope and limitations evidence.

## Separation from product analytics

`product_events` remains product analytics and is not psychometric calibration data. Funnel events cannot be reverse-engineered into an answer dataset.

Answer-level calibration storage and retest-linkage schemas now exist, but actual baseline/retest row collection/use still requires separately gated consented runtime issue/ingest/claim paths; `CALIBRATION_EXPORT_SPEC_v0.1.md` remains the raw-materialization boundary.

## Public claims

During this protocol state:

- public validation claims are prohibited;
- rarity/population claims remain prohibited except scoped observed-sample statistics under their separate policy;
- C01D remains an experimental engineering schema;
- a polished 64-type catalog does not count as psychometric evidence.

## Automated evidence

`scripts/validate-calibration-protocol.mjs` fails CI if collection/export/public-validation claims are enabled, required activation prerequisites disappear, the analysis bundle is weakened, a universal sample magic number is inserted, or versioned change control is disabled.
