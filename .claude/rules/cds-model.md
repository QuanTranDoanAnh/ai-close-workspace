---
paths:
  - "db/**/*.cds"
  - "srv/*.cds"
  - "app/**/*.cds"
  - "db/data/*.csv"
---

# CDS model and service definitions

Full rules: `docs/development-standards.md`, sections 4 and 5. Check: `npm run lint:cds` and `npm run lint:es`.

- Namespace `closeworkspace` for the domain model, `sim` for simulated-mode data (CDS-01).
- Entities: PascalCase and plural (`Proposals`). Types and aspects: PascalCase and singular (`ProposalStatus`). Elements: camelCase; the only upper-case name is the key `ID` (CDS-02 to CDS-05).
- An element does not repeat its entity name: `Runs.status`, not `Runs.runStatus` (CDS-06).
- Booleans start with `is`, `has`, `can` or `should` (CDS-07).
- Associations are managed. To-one is singular, to-many is plural (CDS-08).
- Any element with a fixed set of codes uses an enum type from `db/types.cds`. Enum values are UPPER_SNAKE_CASE (CDS-10, CDS-11). A new code element is also added to `enumElements` in `tools/lint/standards.config.mjs`, which needs the user's approval.
- `Decimal` declares precision and scale, `String` a length. Amounts are `Decimal(15, 2)` with a currency (CDS-13).
- Business entities use `cuid` and `managed` from `@sap/cds/common` (CDS-12, CDS-15).
- Entities are defined under `db/` only. Services project them and define no persistence of their own (CDS-14, SRV-03).
- Labels are defined once in `db/labels.cds` as `@title: '{i18n>key}'`, with the text in `db/_i18n/i18n.properties` (CDS-16, SRV-06).
- One service per file, directly in `srv/`: `WorkspaceService` in `srv/workspace-service.cds`, handler in `srv/workspace-service.ts` (SRV-07).
- Every service carries `@requires` or `@restrict`. Roles are exactly `Controller`, `Auditor`, `Viewer`, `DemoAdmin` (SRV-02, BTP-10).
- Actions and functions are camelCase and start with a verb. Actions change state, functions only read (SRV-04).
- UI annotations go to `app/<app>/annotations.cds`, never into `srv/` or `db/`.
- Seed data: `db/data/<namespace>-<Entity>.csv`, header equal to the element names (FILE-07). Synthetic values only. Keep the check values of `docs/intent-spec.md`, section 13.

The data model printed in `docs/architecture-spec.md`, section 8, predates these rules. Apply the corrections listed in `CLAUDE.md`.
