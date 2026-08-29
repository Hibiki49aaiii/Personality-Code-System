# Issue #5 Implementation Plan — Security / Privacy Hardening Review

## Metadata

- Issue: #5 `chore: security/privacy hardeningを再監査しリリース境界を固定`
- Base Commit SHA: `9436205e429bdbbf6d29a9561dc5dfe6485133ed`
- Base branch: `main`
- Working branch: `issue-5-security-privacy-hardening`
- Base CI: Run #740 failed at calibration prerequisite drift
- Base CodeQL: Run #73 succeeded

## Requirements

1. Re-audit repository-side security/privacy boundaries without claiming external deployment evidence.
2. Reuse existing security primitives instead of introducing a parallel middleware/security framework.
3. Ensure state-changing first-party Route Handlers consistently reject hostile browser origins before DB mutation/rate-limit work.
4. Add machine-verifiable regression coverage so the route-level guard cannot silently drift.
5. Preserve existing anonymous-session, rate-limit, deletion, retention, public-share and privacy-safe-log behavior.
6. Keep PCS-QA-007 deployment/manual controls fail-closed and out of scope.

## Current Architecture

The application uses Next.js App Router Route Handlers under `src/app/api/**/route.ts`.

Existing cross-site mutation protection is implemented in:

- `src/server/requestSecurity.ts`
  - `assertTrustedMutationRequest(request)`
  - compares `Origin` to canonical `PCS_SITE_ORIGIN`
  - rejects `Sec-Fetch-Site: cross-site`
  - intentionally tolerates missing browser-origin metadata so trusted non-browser/internal test clients remain usable.

Existing handlers already using this primitive:

- `PUT /api/assessment/answer`
- `POST /api/assessment/complete`
- `POST /api/share`
- `DELETE /api/share`
- `DELETE /api/assessment/data`

Audit finding:

- `POST /api/assessment/session` mutates persistence / creates or resumes a private session and sets the bearer cookie, but does not call the guard.
- `POST /api/analytics` writes first-party product-event rows, but does not call the guard.

The browser analytics client posts only to same-origin `/api/analytics`, so no intentional cross-origin integration depends on accepting hostile origins.

## Target Architecture

Retain the current per-route guard pattern. Do not introduce new middleware.

Every browser-facing state-changing first-party Route Handler in the current API set will call `assertTrustedMutationRequest()` before database/rate-limit mutation:

- analytics POST
- assessment session POST
- assessment answer PUT
- assessment complete POST
- assessment data DELETE
- share POST
- share DELETE

Read-only GET handlers remain unchanged.

`scripts/validate-security-baseline.mjs` will recursively discover `src/app/api/**/route.ts` mutation handlers, compare them to the reviewed guarded-route contract, and enforce guard presence. CI therefore fails both when an existing guard disappears and when a new state-changing route is added without explicit security review.

## Data Flow

### Session creation

Browser -> `POST /api/assessment/session`
-> trusted-origin guard
-> rate-limit
-> create/resume anonymous assessment
-> best-effort first-party event
-> HttpOnly bearer cookie response.

Hostile cross-site browser request:
-> guard rejects with fixed 403 response
-> no rate-limit bucket consumption
-> no DB session creation/resume
-> no cookie mutation.

### Client analytics

Browser -> `POST /api/analytics`
-> trusted-origin guard
-> body validation
-> rate-limit
-> product-event privacy validation
-> persistence.

Hostile cross-site browser request:
-> guard rejects with fixed 403 response
-> no analytics persistence.

## State Transitions

No persisted schema/state-machine semantics change.

Only an authorization precondition is added before existing mutation paths.

- trusted request: existing behavior unchanged
- hostile-origin request: transitions from previously processable/reject-later behavior to deterministic 403 before mutation
- missing Origin + non-cross-site Fetch Metadata: existing CLI/test-client compatibility remains

## Files Expected to Change

### Runtime
- `src/app/api/assessment/session/route.ts`
- `src/app/api/analytics/route.ts`

### Shared/error handling
- Prefer reuse of existing `CrossSiteMutationError` and fixed response schema.
- Avoid introducing a new abstraction unless duplication becomes materially worse.

### Verification
- `tests/e2e/csrf-origin.spec.ts`
- `scripts/validate-security-baseline.mjs`

### Documentation
- `docs/requirements/08_PRIVACY_SECURITY.md`
- `docs/reviews/SECURITY_PRIVACY_RELEASE_QA_v0.1.md`

No DB migration is expected.

## API Changes

No success-response schema changes.

New observable behavior:

- hostile-origin `POST /api/assessment/session` returns HTTP 403 with `CROSS_SITE_MUTATION_REJECTED`.
- hostile-origin `POST /api/analytics` returns HTTP 403 with `CROSS_SITE_MUTATION_REJECTED`.

Same-origin requests remain unchanged.

## DB / Migration

- DB schema: unchanged
- Migration: none
- Retention/deletion semantics: unchanged

## Error Handling

Use the existing fixed response:

```json
{
  "error": "CROSS_SITE_MUTATION_REJECTED",
  "message": "この操作は同一サイトから実行してください。"
}
```

Do not echo Origin, URL, cookies, tokens, headers, stack traces or secrets.

## Security Considerations

- Guard must execute before rate-limit and DB mutation.
- Same-origin canonical comparison remains owned by `getSiteOrigin()`.
- No CORS allowlist is added.
- No proxy/header assumptions are changed.
- Production trusted-proxy proof remains an external PCS-QA-007 gate.
- The current lockfile resolves Next.js `16.3.3`, the August 2026 security release level; no dependency change is needed for this issue.

## Testing Strategy

1. Extend `csrf-origin.spec.ts`:
   - hostile session POST => 403
   - hostile analytics POST => 403
   - fixed error body has no reflected attacker origin/secret/stack/hash
   - same-origin session creation still succeeds
2. Extend `validate-security-baseline.mjs` to assert guard coverage for every current mutation route.
3. Run repository security/privacy validators.
4. Run typecheck and build.
5. Run relevant E2E.
6. Observe GitHub Actions / CodeQL on branch.

## Implementation Order

1. Add guard to session POST before rate limit / DB work.
2. Add guard to analytics POST before body parsing and DB work.
3. Map analytics CrossSiteMutationError to the existing fixed 403 shape.
4. Extend E2E hostile-origin cases.
5. Add static route discovery + reviewed guard-contract validation.
6. Synchronize security/privacy docs.
7. Run targeted verification.
8. Update Issue #5 with actual changed files/results.

## Rollback

All runtime changes are local precondition checks with no migration. Rollback is a normal commit revert.

## Known Risks

- A legitimate external caller using cross-origin browser requests would be rejected; current code/docs define analytics and assessment as first-party same-origin only, so this is not an intended supported flow.
- Static discovery intentionally detects only exported POST/PUT/PATCH/DELETE Route Handlers, then requires every discovered mutating file to exist in the explicit reviewed guard map. This avoids silent new-route drift while keeping route semantics reviewable.
- Base CI is already red because of unrelated calibration prerequisite drift. This issue must not rewrite calibration semantics to make CI green.

# Human Understanding Summary

## What
Close a route-level CSRF/Origin coverage gap for session creation and first-party analytics, and make CI detect future coverage drift.

## Why
The repository already claims a complete automated CSRF/origin foundation, but two current state-changing first-party endpoints do not use the shared guard. Security documentation and runtime behavior should agree.

## How
Reuse `assertTrustedMutationRequest()` in the two missing POST handlers, extend the existing browser security test, and teach the existing security validator the explicit mutation-route guard contract.

## Important Decisions
- Keep per-route guards; no new middleware/security framework.
- Reject before rate-limit/DB mutation.
- Keep external deployment evidence out of scope.
- Do not touch calibration semantics even though base CI is red there.

## Invariants
- Anonymous assessment remains accountless.
- Private bearer capability never appears in URL/log/analytics payload.
- Public share remains explicit opt-in and sanitized.
- Cross-site rejection responses remain fixed-schema and non-reflective.
- No production/manual gate becomes complete without real evidence.

## Failure Modes
- New mutation route added without updating the guard contract.
- Canonical site origin misconfigured in preview/production.
- Future route intentionally needs cross-origin behavior but is incorrectly forced into the first-party guard contract.

## Change Impact
Future browser-facing mutation endpoints must either use the trusted mutation guard or explicitly change the security contract with design review.

# Pre-Implementation Review

## Pass 1 — Requirements

Finding: runtime/docs claim broad state-changing request protection, but session creation and analytics writes are not guarded.

Triage: **採用**. Fix within Issue #5.

Finding: base CI calibration drift is unrelated.

Triage: **今回は対象外**. Preserve as explicit baseline failure.

## Pass 2 — Architecture

Finding: introducing middleware would duplicate existing `requestSecurity.ts` and broaden regression risk.

Triage: **不採用**.

Finding: existing per-route primitive is already the dominant architecture.

Triage: **採用**.

## Pass 3 — Risk

Finding: hostile session POST can reach session creation/resume and cookie-setting path without the repository's origin guard.

Triage: **採用**.

Finding: hostile analytics requests can reach analytics mutation path without the same origin guard.

Triage: **採用**.

Finding: production TLS/proxy/secret-store/database-provider controls cannot be proven in repository code.

Triage: **今回は対象外** and remain fail-closed in PCS-QA-007.

Finding: no dependency upgrade needed because `package-lock.json` already pins Next.js 16.3.3.

Triage: **不採用** as a code change.
