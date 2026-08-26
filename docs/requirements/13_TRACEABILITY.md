# 13 — Requirement Traceability

## Purpose

Traceability prevents requirements from becoming decorative documentation. A checked requirement should have evidence showing where it is implemented and how it is verified.

## Traceability record

From Phase 1 onward, maintain a table or machine-readable equivalent with at least:

| Requirement ID | Status | Implementation | Test/Evidence | Version impact | Notes |
| --- | --- | --- | --- | --- | --- |
| PCS-SCORE-004 | planned | — | — | assessment model | deterministic normalized scoring |

The table may later move to generated documentation if automated tooling is introduced, but requirement IDs remain stable.

## Status vocabulary

Use one of:

- `planned`
- `in-progress`
- `implemented-unverified`
- `verified`
- `blocked`
- `superseded`

The checkbox in `REQUIREMENTS.md` should normally be checked only when the corresponding requirement is `verified` or when it represents an already-completed foundational decision with direct evidence.

## Acceptable evidence

Depending on the requirement:

- source file/function path;
- unit/integration/E2E test name;
- golden fixture;
- CI run;
- visual regression screenshot;
- accessibility audit/checklist;
- privacy/network payload audit;
- statistical analysis report/notebook;
- approved content/illustration catalog entry;
- release artifact/tag;
- migration/restore test record.

A commit hash alone is insufficient if it does not demonstrate requirement behavior.

## Requirement change record

For every material requirement change record:

- date;
- affected requirement IDs;
- old behavior/requirement;
- new behavior/requirement;
- rationale;
- impacted files;
- assessment model impact;
- code schema impact;
- content impact;
- data migration impact;
- compatibility impact;
- tests/evidence updated.

Suggested format:

```md
### YYYY-MM-DD — Short title
- IDs: PCS-...
- Change: ...
- Reason: ...
- Versions: assessment none / content X -> Y / app ...
- Evidence: ...
```

## Version impact decision

Every diagnostic-related change must answer:

### Assessment model version changes if

- active item membership changes;
- semantic item wording changes;
- scoring weights/directions/formula change;
- normalization/completion rules change;
- trait definition materially changes in a way that changes measurement interpretation;
- Core classification boundary is defined as part of assessment model and changes.

### Code schema version changes if

- public code syntax/meaning changes;
- Core/Extended Code fields are reinterpreted;
- parsing/backward compatibility changes.

### Content version changes if

- result claim/prose meaning changes;
- module activation/precedence changes without changing underlying measurement;
- type names/descriptions materially change.

### Asset version changes if

- type illustration/share template changes while result semantics stay stable.

### App-only change if

- layout/visual/implementation changes produce no diagnostic/content semantic change.

## Contradiction audit checklist

Before checking a milestone complete:

- [ ] master requirement and derivative file agree;
- [ ] old supporting docs do not contain known contradictory guidance;
- [ ] implementation follows the documented version;
- [ ] tests reflect current intended behavior;
- [ ] public copy does not overclaim evidence status;
- [ ] no AI runtime dependency has been introduced;
- [ ] privacy/analytics behavior still matches docs.

## Current traceability

| Scope / Requirement | Status | Implementation | Test / Evidence | Version impact | Notes |
| --- | --- | --- | --- | --- | --- |
| PCS-FE-001 | verified | Next.js/React/TypeScript scaffold | CI typecheck + build | app | foundation |
| PCS-FE-002 | verified as foundation | responsive CSS and assessment UI | browser E2E foundation | app | full width certification still later QA |
| PCS-QA-001 | verified | `.github/workflows/ci.yml` | typecheck + production build steps | app | current Phase 3 full run may still be queued |
| PCS-GOV-001..010 | verified as governance decisions | `REQUIREMENTS.md` + derivative requirement set | requirement-ID validator | governance | master meanings remain authoritative |
| PCS-SCORE-001..006 | verified as development model engineering | reviewed Item Bank + scoring domain | Item Bank validators, scoring Golden tests | assessment | statistical calibration remains Phase 5 |
| PCS-RESULT-001..005 | verified as development result engine | Core/Extended Code, Interaction, Composer, Snapshot | domain tests + frozen snapshots | result/content | public taxonomy not implied |
| Phase 2B persistence foundation | verified | Drizzle/PostgreSQL repositories and migrations | PostgreSQL integration suite | persistence | private result/version immutability |
| Phase 2C real development assessment | verified | assessment API/UI/private result | Chromium 147-item E2E | app/model | historical successful Phase 2 CI evidence retained |
| Phase 3A Core editorial materialization | implemented-unverified on latest HEAD | `data/type-catalog/v0.1-dev/*`, content v0.2/v0.3 materializers | `validate:type-catalog`, `validate:content`, v0.2/v0.3 Golden snapshot tests | content | latest full Phase 3 CI run must complete before status becomes verified |
| Phase 3A draft display-name system | implemented-unverified on latest HEAD | `display-name-system.ja.json`, `materialize-type-display-names.mjs` | `validate-type-display-names.mjs`, `docs/reviews/TYPE_NAMES_v0.1-dev.md` | content/name | 64 names are machine-valid but owner editorial approval is pending |
| PCS-CONTENT-010..015 | in-progress | versioned Core/Trait editorial primitives | content validators + review ledger | content | human Japanese/Interaction review still required |
| PCS-ART-010..015 | in-progress foundation only | `docs/ILLUSTRATION_SYSTEM.md`, `data/illustration/v0.1-dev/system.json` | `validate-illustration-slots.mjs` | asset | 64 slots exist; actual hero artwork remains `unproduced` |

## Phase 3 evidence map

### Type identity / naming

- Reachability source: `data/type-catalog/v0.1-dev/reachability.json`
- Structural/editorial scaffold: `data/type-catalog/v0.1-dev/editorial-scaffold.json`
- Core editorial primitives: `data/type-catalog/v0.1-dev/editorial-primitives.ja.json`
- Draft display-name vocabulary: `data/type-catalog/v0.1-dev/display-name-system.ja.json`
- Materializer: `scripts/materialize-type-display-names.mjs`
- Validator: `scripts/validate-type-display-names.mjs`
- Human review ledger: `docs/reviews/TYPE_NAMES_v0.1-dev.md`
- Design contract: `docs/TYPE_DISPLAY_NAME_SYSTEM.md`

### Detailed deterministic dossier

- Base development content: `data/content/dev-v0.1.json`
- Type-content release manifest: `data/content/dev-v0.2.json`
- Detailed Trait-content release manifest: `data/content/dev-v0.3.json`
- Trait editorial primitives: `data/content/trait-editorial-primitives.ja-v0.1-dev.json`
- Materializers: `scripts/materialize-content-v0.2.mjs`, `scripts/materialize-content-v0.3.mjs`
- Validators: `scripts/validate-content-v0.2.mjs`, `scripts/validate-content-v0.3.mjs`
- Golden fixtures: `tests/fixtures/result-snapshot-midpoint-v0.2.json`, `tests/fixtures/result-snapshot-midpoint-v0.3.json`
- Exact tests: `tests/domain/result-snapshot-v0.2.mjs`, `tests/domain/result-snapshot-v0.3.mjs`

### Illustration foundation

- Art direction: `docs/ILLUSTRATION_SYSTEM.md`
- Machine-readable motif/slot grammar: `data/illustration/v0.1-dev/system.json`
- Slot materializer: `scripts/materialize-illustration-slots.mjs`
- Slot validator: `scripts/validate-illustration-slots.mjs`
- Current status: all 64 C01D hero slots deliberately `unproduced`; no production image is implied by the mapping itself.

## Material change records

### 2026-08-27 — Versioned Phase 3 editorial generations
- IDs: PCS-CONTENT-001..003, PCS-CONTENT-010..015
- Change: development result copy advanced from fallback-heavy `content-dev-v0.1` to type-specific v0.2 and detailed Trait-band v0.3 while preserving earlier releases.
- Reason: add high-resolution deterministic result content without mutating historical snapshots.
- Versions: assessment-dev-v0.1/v0.2/v0.3 and content-dev-v0.1/v0.2/v0.3 coexist; scoring/code/interaction semantics remain unchanged.
- Evidence: materializers, seed integration, Golden snapshots, Application/E2E assertions.

### 2026-08-27 — Draft display-name grammar
- IDs: PCS-CONTENT-010, PCS-CONTENT-014, PCS-CONTENT-015
- Change: add reversible `{action}の{role}〈relationship〉` development display-name grammar for all 64 C01D codes.
- Reason: improve human recognition and future social-card/illustration identity while preserving six-axis claim provenance.
- Versions: independent `type-display-name-system-ja-v0.1-dev`; `public_use=false`.
- Evidence: 64-name validator and explicit review ledger. Public owner approval remains open.

### 2026-08-27 — Illustration identity foundation
- IDs: PCS-ART-010..015
- Change: define non-AI runtime art direction and stable 64 development asset slots.
- Reason: allow art production to proceed without ad-hoc per-type prompts or mutable runtime generation.
- Versions: `illustration-system-v0.1-dev`; all slots unproduced.
- Evidence: illustration slot materializer/validator and art-direction specification.
