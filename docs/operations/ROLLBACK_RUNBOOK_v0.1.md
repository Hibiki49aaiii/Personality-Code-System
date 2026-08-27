# Production Rollback Runbook v0.1

> Status: operational procedure contract; deployment-specific commands/identifiers must be filled from the actual production platform.
> Date: 2026-08-27
> Release policy: `release-operations-v0.1-dev`

## Purpose

Define how PCS is rolled back without rewriting published diagnostic history. Application code, database schema, assessment model, content, illustration assets, and share-card templates are separate rollback domains and MUST be evaluated independently.

A rollback is successful only when diagnostic correctness, privacy boundaries, public-share behavior and observability checks are restored.

## Activation criteria

Start rollback/forward-fix handling when a release causes or plausibly causes:

- materially wrong diagnostic output;
- deterministic-output regression;
- raw answer/private result exposure;
- authorization/share-link failure;
- data corruption or migration failure;
- broad unavailability;
- malicious content execution;
- severe performance/accessibility regression that blocks the core assessment flow.

For suspected privacy/security exposure, treat evidence preservation and credential/token containment as incident work in parallel with rollback.

## Immediate containment

1. Record application commit/release ID, assessment model version, code schema, content version, asset/template version and deployment timestamp.
2. Stop further promotion.
3. Identify the affected time window and routes.
4. If the active assessment model/content itself is suspect, stop assigning it to **new sessions** before attempting historical mutation.
5. Preserve relevant privacy-safe logs/metrics and database backup/snapshot evidence.
6. Do not expose raw answers or bearer/share capabilities in incident notes.

## 1. Application code rollback

Preferred action:

1. identify the last known-good commit that passed the same release gate;
2. redeploy that immutable commit/artifact;
3. do not change assessment/content versions merely to make old code start;
4. run health, anonymous-start, answer-save, completion, private-result and explicit-share smoke checks;
5. confirm security headers and cross-site mutation protection.

If the old application is incompatible with a forward-only database change, use a forward compatibility patch instead of forcing an unsafe schema reversal.

## 2. Database migration rollback / forward-fix

Default policy is **forward-fix**, not destructive reverse SQL.

Before any schema corrective action:

1. identify the exact migration boundary;
2. verify a production backup/snapshot exists and is restorable under the platform runbook;
3. check whether the migration has already written/transformed data;
4. classify the change as additive, reversible metadata-only, or destructive/data-transforming;
5. use a new corrective migration for destructive/data-transforming failures unless a tested reverse procedure exists.

Never delete/rewrite published model/content/result history merely to make the schema look like an older release.

After correction, verify migration ordering, foreign keys, publication immutability triggers, anonymous-session writes and result-snapshot reads.

## 3. Assessment model rollback

Assessment model selection is versioned independently from application code.

Procedure:

1. stop assigning the suspect model version to new sessions;
2. select a previously reviewed compatible model version;
3. preserve existing sessions/results on their original exact model version;
4. do **not** mutate published item mappings, scoring keys or model version rows in place;
5. confirm code-schema/interaction/content compatibility before activating the prior model for new sessions;
6. run the 147-item deterministic/Golden/application integration gates for that exact manifest.

If no compatible previous model exists, disable new assessment starts or deploy an explicit maintenance state rather than silently changing scoring semantics.

## 4. Content rollback

Content is versioned independently.

- Point only **newly composed results** to a previously approved compatible content version when the model contract permits it.
- Historical result snapshots continue referencing the content version captured at completion.
- Never replace the bytes/text of an already published content version.
- If a harmful statement is legally/safety-critical, use an explicit new content revision plus a documented historical-display mitigation rather than rewriting provenance.

## 5. Illustration/asset rollback

- Restore a known-good asset mapping/version.
- Do not reuse an existing asset ID for different artwork.
- Keep historical snapshot/share references resolvable where the final snapshot contract requires exact asset identity.
- If an asset is unsafe/unlicensed, use a versioned approved fallback and record why the affected asset was retired.

## 6. Share-card template rollback

- Revert the deterministic OG/portrait template to a known-good version.
- Verify raw answers, Extended Code/private internals, tokens and private session IDs remain absent.
- Verify revoked links still return invalid/not-found behavior.
- Check byte determinism for a fixed sanitized share snapshot where the template contract expects it.

## Verification after any rollback

Release-blocking smoke checks:

- `GET /api/health` is healthy;
- anonymous assessment starts without account;
- answers save only to the bound session/model;
- completion remains deterministic;
- private result requires the private bearer cookie;
- explicit sharing creates only a sanitized separate snapshot;
- revoked share links fail;
- hostile cross-site mutations fail;
- CSP/security headers are present;
- production client build contains no forbidden secrets/source maps;
- performance artifact budget remains within the approved version;
- no runtime AI/LLM dependency/credential is required.

## Data impact / affected-result handling

If diagnostic correctness changed for sessions already completed:

1. identify the exact model/content/version and time/session range;
2. do not silently recompute historical results against a new version;
3. decide whether results remain valid, require a visible limitation notice, or must be invalidated;
4. preserve the original snapshot for audit/privacy-retention rules unless deletion is required;
5. record the decision and remediation version.

## Roll-forward decision

Prefer roll-forward when:

- database changes cannot be safely reversed;
- an older app cannot operate against the migrated schema;
- a small deterministic patch is lower risk than reverting multiple independent version domains.

Roll-forward still requires CI/release gates and must not rewrite published diagnostic versions.

## Required deployment-specific evidence before production launch

This generic runbook becomes executable production evidence only after the deployment platform records:

- production deployment/rollback command or UI procedure;
- environment/release identifiers;
- backup provider/snapshot procedure;
- restore rehearsal result;
- traffic/maintenance-mode procedure;
- secret rotation procedure;
- monitoring/alert escalation contacts;
- owner/approver roles.

Those are OPS-001/002/003/006 or deployment QA concerns and are not invented in this repository-level runbook.
