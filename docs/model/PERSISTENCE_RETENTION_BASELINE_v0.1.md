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
| Calibration dataset | Not created by default | Requires a separate consent/basis, extraction schema and governance decision. |
| Public share result | Until revoked / source privacy deletion / later public policy | Phase 4 creates explicit sanitized snapshots. User revocation disables active links; bearer-owned full diagnostic deletion physically deletes shares derived from the private result. |

## Cleanup behavior

- Session cleanup may delete answers and the anonymous session together after their applicable retention window.
- The current user-controlled deletion path is `DELETE /api/assessment/data`, authenticated by the private session capability; it deletes derived public shares first, then deletes the owning anonymous session so answers, Trait Scores, private result and session-bound analytics cascade away.
- Result-snapshot cleanup must not cascade-delete published model/item/content metadata.
- Scheduled deletion jobs operate on internal UUIDs and timestamps, not bearer tokens. The interactive self-deletion path necessarily authenticates with the browser bearer capability but stores/looks up only its server-side hash.
- A result snapshot is immutable while retained; retention deletion is not considered mutation.

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
