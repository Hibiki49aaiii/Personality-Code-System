# OBSERVABILITY_RUNBOOK_v0.1

> Status: repository foundation; production provider/routing evidence pending
> Contract: `data/operations/observability-v0.1-dev.json`

## Objective

Detect availability, correctness, privacy/security and severe performance regressions without turning diagnostic data into an observability payload.

## Safe signal boundary

Operational monitoring MUST NOT include raw answers, complete Trait vectors, Extended Code, bearer/share tokens or free-form browser stack/message telemetry by default.

The current first-party product-event stream is useful for privacy-safe aggregate product signals, but it is stored in the application database and is best-effort. It is therefore **not** sufficient as the independently durable production incident monitor.

## Readiness probe

`GET /api/health` is the minimal readiness target:

- 200 + `{"status":"ok"}` when the PostgreSQL readiness query succeeds;
- 503 + `{"status":"degraded"}` when it fails;
- no database URL, host, schema/version, exception or stack details.

The production monitor should probe this route from outside the application deployment at approximately one-minute cadence. The current contract proposes alerting after three consecutive failed probes; the actual provider configuration and evidence must be recorded before OPS-003 closes.

## Required production monitor classes

1. **Independent readiness/availability** — external HTTP probe of `/api/health`.
2. **Application/server errors** — independently durable 5xx/exception visibility.
3. **Assessment finalization health** — alert on sustained completion failures, not individual abandoned assessments.
4. **Database availability/latency** — platform/database metrics independent of the primary application tables.
5. **Deployment correlation** — every alert/incident must resolve to immutable application release/commit and active model/content/asset versions.
6. **Field performance** — LCP/INP/CLS p75 by suitable scope/sample when real traffic exists.

## Severity / response

P0: suspected private diagnostic exposure, widespread wrong results, share authorization bypass, material data loss.

P1: broad outage, sustained finalization failure, severe release regression.

P2: localized feature or non-critical performance defect.

For P0/P1:

- stop normal promotion;
- record commit/release and affected time window;
- preserve privacy-safe evidence;
- use `ROLLBACK_RUNBOOK_v0.1.md` where release rollback/forward-fix is appropriate;
- never paste raw answers or bearer capabilities into incident systems.

## Aggregate product-event checks

The following first-party events may support trend analysis:

- `assessment_started`;
- `assessment_completed`;
- `client_error`;
- `server_error`;
- `performance_measure`.

Do not interpret start→complete ratio alone as a finalization error rate because normal abandonment is expected. Production finalization failure monitoring must be derived from server/API failure telemetry or an independently durable monitor.

## Evidence required before PCS-OPS-003 closure

Record:

- monitor/provider or independent-probe identity;
- actual probe/collection configuration;
- alert destination/escalation owner;
- deployment-version correlation proof;
- at least one test alert or incident drill;
- production retention scheduler evidence;
- proof that observability payloads respect the privacy boundary.

Until those fields exist, `production_operational=false` remains mandatory.
