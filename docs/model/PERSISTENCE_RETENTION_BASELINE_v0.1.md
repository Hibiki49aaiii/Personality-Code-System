# Persistence Retention Baseline v0.1

> Status: Phase 2B engineering baseline; legal/privacy review required before public launch.
> Date: 2026-08-26

## Principles

- Store less than the UI could theoretically collect.
- Keep identity/account data separate from anonymous diagnostic data.
- Raw answers are not copied into result snapshots.
- Public sharing is a later opt-in feature and is not implied by completion.
- Model/content/version metadata required to reproduce historical results is retained independently of user diagnostic-data retention.

## Baseline retention windows

| Data class | Baseline | Trigger / notes |
| --- | --- | --- |
| Abandoned anonymous session + draft answers | 30 days | Since `updated_at`; delete after expiry. |
| Completed raw answers | 90 days | Since completion; intended for support/reliability debugging during MVP/beta. |
| Private derived result snapshot | 180 days | Since completion unless later saved under an explicit user-controlled feature. |
| Published model/item/code/content metadata | Indefinite while any historical result may reference it | Not personality data for one user; required for reproducibility. |
| Operational application logs | 30 days | Raw answers, full Trait vectors and bearer tokens excluded by default. |
| Database backups | 35 days | Subject to deployment-provider recovery design. |
| Calibration consent receipt | Owner-session-bound engineering behavior | Storage-only schema exists for a future explicit purpose/version receipt; runtime role has zero access until activation. If present through controlled testing/future activation, withdrawal is recorded and owner-session deletion cascades the receipt. Final legal retention promise remains pending. |
| Calibration row-level research artifact | Max 180 days after wave close (engineering candidate) | Not created by default. Withdrawal/self-deletion overrides time retention; active offline artifacts must be purged/regenerated before further use. Final legal approval and implementation remain pending. |
| Calibration operator audit metadata | 365 days (engineering candidate) | Future bounded operational accountability metadata only; raw responses/participant diagnostic payload are prohibited. Audit storage is not implemented yet. |
| Public share result | Until revoked / source privacy deletion / later public policy | Phase 4 creates explicit sanitized snapshots. User revocation disables active links; bearer-owned full diagnostic deletion physically deletes shares derived from the private result. |

## Cleanup behavior

- Session cleanup may delete answers and the anonymous session together after their applicable retention window.
- The current user-controlled deletion path is `DELETE /api/assessment/data`, authenticated by the private session capability; it deletes derived public shares first, then deletes the owning anonymous session so answers, Trait Scores, private result and session-bound analytics cascade away.
- Result-snapshot cleanup must not cascade-delete published model/item/content metadata.
- Scheduled deletion jobs operate on internal UUIDs and timestamps, not bearer tokens. The interactive self-deletion path necessarily authenticates with the browser bearer capability but stores/looks up only its server-side hash.
- A result snapshot is immutable while retained; retention deletion is not considered mutation.

## Executable development retention tooling

The engineering baseline is now represented by `data/privacy/diagnostic-retention-v0.1-dev.json` and an executable dry-run-first cleanup command:

- `npm run cleanup:diagnostic` — inspect expired diagnostic rows only;
- `npm run cleanup:diagnostic -- --execute` — execute only when `PCS_DIAGNOSTIC_RETENTION_EXECUTION_ACK=diagnostic-retention-v0.1-dev` is also set.

Current behavior:

- in-progress sessions older than 30 days by `updated_at` are deleted with their draft answers;
- completed raw answers older than 90 days are deleted while the completed session, Trait Scores and private result remain;
- completed sessions/private results/Trait Scores older than 180 days are deleted together;
- when a 180-day private result disappears, existing result-delete behavior revokes active derived public shares and detaches their private source reference;
- explicit bearer-owned user deletion remains available earlier and is a separate path.

Migration `0007_diagnostic_retention_answer_guard.sql` preserves completed-answer immutability for the first 90 days, then permits direct retention deletion after the database-observed completion age crosses 90 days. The policy window and DB guard are versioned together.

CI executes a real PostgreSQL retention integration proving dry-run non-destruction, 30/90/180-day deletion behavior, preserved 91-day private results and automatic public-share revocation/detachment at the 180-day private-result boundary.

This is repository execution tooling, not proof that a production scheduler is actually configured.

## Calibration governance

`data/calibration/governance-policy-v0.1-dev.json` defines the current engineering candidate before any research export implementation exists.

Key rules:
- row-level calibration artifacts have a 180-day maximum after wave close;
- consent withdrawal or bearer-owned self-deletion takes precedence over the clock;
- any offline artifact containing a withdrawn record must be purged or regenerated before further analysis;
- raw calibration export requires requester + different approver;
- operator audit metadata is bounded and may not contain raw participant/diagnostic payload;
- operator audit metadata uses a 365-day engineering baseline.

These values are not final legal/public promises. Operator authentication, audit storage, targeted deletion linkage and raw export materialization remain absent, so collection/export activation stays blocked.

## Logging exclusions

Do not log by default:

- raw answer values;
- complete Trait vectors;
- Extended Code;
- result prose;
- anonymous session bearer token;
- token hash unless required for narrow security debugging.

## Before public launch

This baseline must be reconciled with the actual Privacy Policy, deployment backup/restore behavior, production retention scheduler, beta/calibration consent and applicable legal requirements. Interactive self-deletion is implemented, but it does not by itself define how already-created backups behave if restored. Changes create a new retention-policy version rather than silently changing historical documentation.
