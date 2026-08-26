# 00 — Requirement Governance

## Purpose

Defines how PCS requirements are changed, interpreted, and verified. This file prevents requirement drift between diagnostic research, implementation, content, and release work.

## Master-ID reservation

`REQUIREMENTS.md` owns the top-level **PCS-GOV-001..010** meanings. This derivative file MUST NOT redefine those IDs. Detailed governance clauses therefore use the **PCS-GOV-020+** range.

## Authoritative rules

- **PCS-GOV-020** `REQUIREMENTS.md` is the top-level contract.
- **PCS-GOV-021** Domain requirement files under `docs/requirements/` are authoritative only within their stated domain and cannot override master invariants.
- **PCS-GOV-022** `PRODUCT_SPEC`, `DESIGN_SYSTEM`, and `DIAGNOSTIC_MODEL` are supporting design/research documents. If they conflict with requirements, requirements win.
- **PCS-GOV-023** A requirement ID is never reused for a different meaning. Removed requirements remain documented as superseded/deprecated.
- **PCS-GOV-024** Any change affecting diagnosis output must identify whether it changes assessment model version, content version, code schema version, or only UI.
- **PCS-GOV-025** Completed checkboxes require evidence. “Looks done” is not completion evidence.

## Requirement-ID integrity

Requirement declarations in `REQUIREMENTS.md` and `docs/requirements/*.md` are machine-checked by `scripts/validate-requirement-ids.mjs`.

The validator MUST fail when:

- the same declaration ID appears twice in one document;
- an unapproved detailed requirement shadows a Master ID;
- the same detailed ID is declared by multiple derivative documents;
- an ID does not use the canonical three-digit suffix.

Only explicitly allowlisted Master/detail aliases whose meaning is intentionally shared may repeat. The allowlist is code-reviewed and intentionally small.

## Runtime AI prohibition

The following are prohibited in production runtime unless this master contract is explicitly changed in a future approved version:

- LLM/API calls to score answers.
- Embeddings/classifiers from generative AI providers to choose a type.
- Prompt-based interpretation of raw answers.
- Runtime generation/rewrite of result prose.
- Runtime generation of type illustrations/share art.
- AI chat as a required diagnostic step.
- AI service outage changing diagnostic availability or result output.

Allowed:

- Developer use of coding assistants, offline drafting, research, or asset ideation.
- Human-reviewed generated drafts committed as normal versioned source/assets, provided the production runtime has no generative dependency.

Production acceptance check:

- [ ] Dependency/env audit confirms no AI API credential is required.
- [ ] Network audit confirms diagnosis/result flow does not call external generative services.
- [ ] Determinism tests pass with network access disabled except required first-party persistence.

## Requirement language

- **MUST**: release-blocking requirement.
- **SHOULD**: preferred; deviation needs documented reason.
- **MAY**: optional.

Unchecked checklist items in `REQUIREMENTS.md` are not automatically MUSTs; their referenced detail defines severity. However all v1.0 launch gates are MUST.

## Change procedure

Any scope/behavior change must:

1. Identify affected requirement IDs.
2. Update `REQUIREMENTS.md` when scope/status changes.
3. Update affected derivative files.
4. Update tests/fixtures if behavior changes.
5. Determine version impact.
6. Add rationale to traceability/change record.
7. Re-run CI and relevant QA.

## Contradiction resolution

When two requirements appear inconsistent:

1. Prefer the higher-precedence document.
2. Prefer a narrower explicit requirement over a broad descriptive statement if both share the same precedence.
3. Do not silently implement an interpretation that changes user-visible behavior.
4. Record the resolution in the next requirement change.

## Definition of Done

A requirement can be checked only when:

- implementation exists where applicable;
- automated/manual verification evidence exists;
- no open known contradiction exists;
- documentation/version metadata is updated;
- CI passes.
