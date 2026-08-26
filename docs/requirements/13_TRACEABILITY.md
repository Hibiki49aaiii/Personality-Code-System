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

## Initial known traceability

| Requirement ID | Status | Evidence |
| --- | --- | --- |
| PCS-FE-001 | verified | Next.js/React/TypeScript scaffold in repository |
| PCS-FE-002 | verified | responsive foundation CSS and assessment prototype |
| PCS-QA-001 | verified | `.github/workflows/ci.yml` typecheck + production build |
| PCS-GOV-001..010 | verified as governance decisions | `REQUIREMENTS.md` + domain requirement set |

This initial table documents only foundation-level evidence. Feature implementation requirements remain unchecked until their code/tests exist.
