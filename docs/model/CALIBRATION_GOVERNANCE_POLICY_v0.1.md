# Calibration Governance Policy v0.1

> Status: **engineering policy ready / runtime disabled / legal approval pending**
>
> Machine contract: `data/calibration/governance-policy-v0.1-dev.json`
>
> This document is an engineering governance baseline, not a final Privacy Policy or legal opinion.

## 1. Purpose

PCS separates ordinary diagnosis, product analytics and psychometric calibration.

Before any answer-level calibration export exists, the repository must define:
- how long row-level research artifacts may exist;
- what withdrawal/self-deletion means after export;
- who may request/approve raw calibration materialization;
- what an operator audit record may contain;
- which implementation pieces must still exist before activation.

This policy intentionally comes **before** export implementation.

## 2. Status boundary

Current state:
- legal approval: false;
- calibration collection: disabled;
- calibration export: disabled;
- runtime operator surface: disabled;
- ordinary application runtime role access: prohibited;
- third-party automatic upload: prohibited.

“Policy ready” means the implementation contract is concrete enough to build against.

It does **not** mean:
- production operator credentials/DB roles are provisioned;
- offline artifact purge exists;
- raw export materializer exists;
- production activation is allowed.

## 3. Consent receipt lifecycle

The existing calibration consent receipt remains bound to its owning anonymous session.

Current engineering behavior:
- receipt begins as `granted`;
- the only supported mutation is `granted -> withdrawn`;
- bearer-owned diagnostic self-deletion removes the owner session and cascades the consent receipt;
- runtime application role still has zero direct access before activation.

No separate long-term legal retention promise for the consent receipt is made by this policy. Final legal/privacy review may require a new policy version.

## 4. Row-level calibration artifact retention

Future row-level calibration artifacts have an engineering maximum of:

**180 days after the wave closes.**

This is a ceiling, not a minimum retention requirement.

Earlier removal takes precedence when:
- consent is withdrawn;
- owner self-deletion applies;
- the research purpose ends;
- a security/privacy incident requires purge;
- a later approved policy shortens the window.

A time-based retention window never overrides withdrawal/deletion obligations.

## 5. Withdrawal after export

A future export implementation must preserve enough restricted linkage to support targeted deletion without exposing the private session capability in the research artifact.

After withdrawal/self-deletion:
1. affected row-level research records become ineligible for further analysis;
2. any active offline artifact containing them must be purged or regenerated;
3. the next analysis/export materialization must exclude them;
4. restored backups must not reactivate them into active research use without withdrawal/deletion replay.

The repository now implements pseudonymous record linkage, normalized fail-closed calibration record/item-response tables, plus an append-only withdrawal/session-deletion journal. The answer-storage tables have no runtime ingest role or API. Raw calibration export remains blocked even though offline operator credential/authentication and execute-only request/review/approve/reject control now exist, because production operator provisioning, raw export materialization/artifact handling and offline artifact purge/regeneration remain absent.

## 6. Aggregate / reproducibility artifacts

Versioned aggregate reports, statistical outputs and release evidence may outlive row-level calibration records only when they contain no:
- row-level item responses;
- participant/session linkage;
- capability token/hash;
- re-identification material.

Such aggregate artifacts may be retained as needed for model/release reproducibility.

## 7. Operator roles

The engineering role model contains four distinct capabilities.

### calibration-export-requester
May request a specifically scoped research materialization.

May not self-approve a raw export.

### calibration-export-approver
Reviews the requested purpose and exact version/scope tuple.

Must be a different operator from the requester for raw export.

### calibration-privacy-operator
Handles withdrawal/deletion/purge workflows and verifies that withdrawn records are removed from active artifacts.

### calibration-reviewer
May review manifests, aggregate results and governance evidence.

Raw answer export is not implied by this role.

## 8. Two-person approval

A raw calibration export requires:
- a requester;
- a different approver;
- explicit purpose/reason code;
- exact wave/schema/consent/model/item/scoring/Trait Dictionary/locale scope;
- approval before materialization.

A browser/public API endpoint must not provide raw calibration export.

The ordinary production application runtime DB role must not receive raw-export capability.

## 9. Operator audit contract

The repository now provides append-only bounded audit-event storage. Every future operator command affecting calibration export/privacy must write one of these bounded audit events.

Required metadata includes:
- audit event ID;
- action;
- requester operator ID;
- approver operator ID where required;
- purpose code;
- exact wave/export/model scope;
- row count;
- artifact SHA-256 when an artifact exists;
- timestamp;
- disposition.

The audit record is operational accountability metadata, not a second diagnostic dataset.

## 10. Forbidden audit payloads

Operator audit must not contain:
- raw item responses;
- session ID;
- private/public capability token or hash;
- IP address;
- precise location;
- participant name/email;
- Trait vector/scores;
- Core/Extended Code;
- Response Quality;
- result prose;
- participant free text.

Audit implementations must use bounded action/reason enums rather than participant-derived free-form text.

## 11. Audit retention

Operator audit metadata uses a **365-day engineering baseline**.

This is not a final public legal promise.

A later legal/security review may change the window via a new policy version.

## 12. Artifact handling

Future raw calibration materialization must:
- be explicitly scoped;
- produce a manifest;
- produce a SHA-256 digest;
- never automatically upload to a third party;
- be stored only in approved research storage;
- be purgeable/regenerable after withdrawal;
- not contain private session/public-share capabilities.

## 13. Backup / restore

A restored calibration artifact or research datastore must be treated as quarantined until:
- withdrawal/deletion state is replayed;
- expired row-level records are removed;
- authorization policy is re-applied.

Restore is not permission to resurrect withdrawn participant data into active analysis.

## 14. Current implementation state

Implemented repository foundations:
- hash-only calibration operator identity storage;
- explicit operator role bindings;
- DB-enforced active requester/approver roles and requester != approver;
- immutable export-request scope with requested → approved/rejected transition;
- append-only bounded operator audit storage;
- pseudonymous calibration-record links bound to consent receipts;
- normalized `calibration_records` / `calibration_item_responses` with exact Wave JA-01/model/item guards and 147-response finalization;
- append-only withdrawal/owner-session deletion journal that survives active-link deletion;
- offline operator credential issuance/authentication/role-management/revocation CLI;
- execute-only `pcs_calibration_auth` and `pcs_calibration_export_control` DB role contracts plus narrowly writable `pcs_calibration_admin`;
- SECURITY DEFINER request/review/approve/reject functions with DB-enforced frozen Wave JA-01 scope and two-person decision.

Still intentionally **not implemented/deployed**:
- production operator DB-role/credential provisioning evidence;
- runtime calibration ingest surface/role;
- raw export materializer/artifact storage;
- offline artifact purge/regeneration executor.

Those remaining pieces continue to block activation.

## 15. Activation boundary

Calibration collection/export still cannot activate until the wider Phase 5A gates are satisfied, including:
- external preregistration;
- explicit repository-frozen version scope *(implemented for Wave JA-01; external preregistration still pending)*;
- final consent/legal/privacy approval;
- production environment separation;
- production operator provisioning evidence;
- withdrawal-targeted deletion linkage;
- approved runtime/materialization implementation.

## 16. Relationship to Wave JA-01

Wave JA-01 currently plans:
- N=1000 target / N=800 structural minimum;
- deterministic 70/30 holdout;
- 14–21 day retest plan;
- no demographic/DIF inference in export v0.1.

This governance policy does not change those research decisions.

## 17. Change rule

Changing:
- row-level retention ceiling;
- audit retention;
- role separation;
- two-person approval;
- audit allowlist/forbidden fields;
- withdrawal/deletion semantics

requires a versioned policy change and review. Existing historical evidence must not be silently rewritten.
