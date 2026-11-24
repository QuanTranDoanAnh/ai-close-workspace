---
paths:
  - "app/workspace/**"
---

# Close Workspace app (SAPUI5 freestyle, TypeScript)

Design rules: `docs/intent-spec.md`, section 9 (FD-01 to FD-18, status vocabulary 9.2, AI content 9.3). Development rules: `docs/architecture-spec.md`, section 6 (FE-01 to FE-23). Naming: `docs/development-standards.md`, section 7. Check: `npm run lint:fiori`, `npm run lint:ui5`, `npm run lint:i18n`.

## Before you write a view

Name the SAP Fiori guideline article the element follows (FD-01) in `docs/work/<ID>/plan.md`. A UI5 sample alone is not evidence. Use the `ui5` MCP server for control APIs and the `fiori` MCP server for guidance instead of guessing.

## Hard rules (the lint kit blocks these)

- Libraries: `sap.m`, `sap.f`, `sap.ui.core`, `sap.ui.layout`, `sap.uxap`; `sap.suite.ui.commons` for the timeline only (FE-02).
- No HTML in views, no `core:HTML`, no DOM access, no jQuery, no custom controls (FE-03).
- No CSS file, no `style` attribute. `class` holds only the standard margin, padding and density classes (FE-04).
- No colour, font or size literals. Theme is `sap_horizon` (FE-05).
- The pane frame is one `sap.ui.layout.ResponsiveSplitter`. No `FlexibleColumnLayout`, `ToolPage` or `SimpleForm` (FE-11, FE-22).
- No text literal in a view, controller or manifest title. Bind `{i18n>key}` (FE-18).
- No `alert`, `confirm`, `prompt`. Use `MessageBox`, `MessageToast`, `MessageStrip`, `MessagePopover` (FE-14).
- OData V4 data sources only. Icons only from `sap-icon://` (FE-17, FE-21).
- `manifest.json`: descriptor version 2, `minUI5Version` pinned, launchpad inbound declared, cozy and compact declared (UI-06, FE-01, FE-08, FE-09).

## Conventions

- Control IDs: lowerCamelCase ending in the control type (`approveButton`). Handlers: `on` + subject + event (`onApprovePress`) (UI-01, UI-02).
- Files: `Workspace.view.xml`, `Workspace.controller.ts`, `EvidenceDialog.fragment.xml`. Every controller has a view of the same name (FILE-05).
- Controllers extend `BaseController`. Formatting lives in `webapp/model/formatter.ts` (UI-07, UI-08).
- Every status is rendered through the one shared status formatter and the vocabulary of section 9.2: text plus semantic state, plus an icon where the guideline has one. No view sets a state literal (FE-12, FD-07).
- Approve is button type `Accept`, Reject is `Reject`. One emphasised button per toolbar. Irreversible actions are confirmed with `MessageBox` (FE-13).
- Amounts, numbers and dates are bound with OData or UI5 types. Amount columns are right-aligned. No manual string formatting (FE-17).
- Lists and tables set `noData` to an `IllustratedMessage`. Panes use the standard busy indication (FE-15).
- Every input has a label. Icon-only buttons have a tooltip. New messages and signals are announced to screen readers (FE-19).
- The app imports nothing from `srv/`, `db/` or Node.js (UI-05).

## What lint cannot see

Layout quality, action placement, message wording, keyboard operation, the four themes and the four sizes. The `fiori-reviewer` agent checks what can be read from code and lists what a person must walk through.
