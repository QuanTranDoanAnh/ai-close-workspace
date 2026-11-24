---
paths:
  - "app/governance/**"
  - "app/admin/**"
  - "app/services.cds"
---

# Agent Governance and Demo Administration (SAP Fiori elements)

Rules: `docs/architecture-spec.md`, section 6 (FE-23), and `docs/intent-spec.md` (FD-18).

- These apps are list report and object page on OData V4. Screens are defined by CDS annotations in `app/<app>/annotations.cds`, pulled in through `app/services.cds`.
- No freestyle views, no controllers, no custom sections, no controller extensions (FE-23). If a requirement seems to need one, stop and ask: it needs an approved deviation in `docs/fiori-deviations.md`.
- Generate and change the apps with the `fiori` MCP server where possible, so that `manifest.json` stays consistent with the template.
- Labels come from the domain model (`db/labels.cds`). Do not repeat `@title` in app annotations. App-specific texts go to `app/<app>/webapp/i18n/i18n.properties`.
- Status fields use `@UI.Criticality` fed by the criticality the service delivers, so both apps and the freestyle app show the same state for the same code.
- Actions (`resetDemo`, `setMode`, `injectEvent`, ...) are bound through `@UI.DataFieldForAction`. Critical ones carry `@Common.IsActionCritical`.
- One service per app: `GovernanceService` (role `Auditor`), `DemoAdminService` (role `DemoAdmin`).
- `manifest.json`: descriptor version 2, app ID `<appIdPrefix>.<folder>`, launchpad inbound with a PascalCase semantic object and lowerCamelCase action (UI-03, UI-04, UI-06).
