# PCS Detailed Requirements Index

The authoritative master checklist is [`../../REQUIREMENTS.md`](../../REQUIREMENTS.md).

These files split implementation requirements by domain so changes can be reviewed without mixing diagnostic science, application architecture, design, privacy, and operations.

| File | Scope |
| --- | --- |
| [`00_GOVERNANCE.md`](00_GOVERNANCE.md) | document precedence, requirement changes, runtime AI prohibition, Definition of Done |
| [`01_PRODUCT_SCOPE.md`](01_PRODUCT_SCOPE.md) | v1 product scope, user journey, exclusions, success metrics |
| [`02_DIAGNOSTIC_MODEL.md`](02_DIAGNOSTIC_MODEL.md) | trait admission, overlap, interactions, evidence/validation status |
| [`03_ITEM_BANK_AND_SCORING.md`](03_ITEM_BANK_AND_SCORING.md) | item lifecycle, response scale, deterministic scoring/confidence/versioning |
| [`04_CODE_AND_RESULT_ENGINE.md`](04_CODE_AND_RESULT_ENGINE.md) | Core/Extended Code, result module composer, contradiction prevention, snapshots |
| [`05_CONTENT_AND_ILLUSTRATION.md`](05_CONTENT_AND_ILLUSTRATION.md) | authored content, localization, curated illustration system |
| [`06_FRONTEND_RESPONSIVE_UX.md`](06_FRONTEND_RESPONSIVE_UX.md) | PC/mobile responsive behavior, assessment/result UX, accessibility/performance |
| [`07_APPLICATION_ARCHITECTURE_AND_DATA.md`](07_APPLICATION_ARCHITECTURE_AND_DATA.md) | domain boundaries, persistence, versions, anonymous/public result architecture |
| [`08_PRIVACY_SECURITY.md`](08_PRIVACY_SECURITY.md) | minimization, retention, user controls, security baseline, threat cases |
| [`09_SOCIAL_SHARING_AND_ANALYTICS.md`](09_SOCIAL_SHARING_AND_ANALYTICS.md) | opt-in sharing, OG/cards, analytics privacy, calibration telemetry, rarity stats |
| [`10_TESTING_QA.md`](10_TESTING_QA.md) | unit/golden/property/integration/E2E, responsive, a11y, privacy/security QA |
| [`11_RELEASE_OPERATIONS.md`](11_RELEASE_OPERATIONS.md) | environments, deployments, model releases, rollback, observability, launch gate |
| [`12_DELIVERY_PHASES.md`](12_DELIVERY_PHASES.md) | ordered development phases and phase exit criteria |
| [`13_TRACEABILITY.md`](13_TRACEABILITY.md) | requirement-to-code/test evidence and version-impact rules |

## Working rule

When starting a task:

1. Find its requirement ID in `REQUIREMENTS.md`.
2. Read the referenced detailed requirement file.
3. Implement without silently widening/narrowing scope.
4. Add tests/evidence.
5. Update traceability/status only after verification.

If implementation reveals a requirement is wrong or incomplete, change the requirement intentionally first (or in the same reviewed change), rather than letting the code become the undocumented source of truth.
