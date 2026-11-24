# Development Standards and Naming Conventions: Close Workspace

| Field | Value |
|---|---|
| Document type | Development standards |
| Version | 0.1 (draft for review) |
| Date | 22 November 2026 |
| Owner | [Owner name] |
| Applies to | All code and configuration in the `close-workspace` repository: CDS models, services, agents, the three SAP Fiori apps, tests, deployment artefacts |
| Companion documents | Intent Specification v0.4, Technical Solution Architecture Specification v0.4 |
| Enforcement | The lint kit in `tools/lint/`, run with `npm run lint` |

## 1. Purpose and principles

These standards exist so that the app set stays readable and changeable after the first demo, by people and coding agents who did not write it. They are based on SAP's own guidance for the SAP Cloud Application Programming Model (CAP), SAPUI5 and SAP Fiori, and they add project rules only where SAP leaves a choice open.

1. **Follow CAP conventions before inventing our own.** Where CAP has a default for a name, a location or a behaviour, we use it. Less configuration means less to maintain.
2. **One name per concept, in every layer.** An entity called `Proposals` in the model is `Proposals` in the service, `proposal` in a TypeScript variable, and `proposal.*` in a text key.
3. **A rule that is not checked is a wish.** Every rule names how it is enforced. Most are automated. The rest are review items and are marked as such.
4. **Deviations are visible.** A rule may be broken only with a recorded reason (section 13.5).

**Rule levels**

| Level | Meaning | Effect |
|---|---|---|
| Must | Required | Lint error. The pipeline fails. |
| Should | Expected unless there is a reason | Lint warning, or a review comment |

**Sources of the rules**

| Area | Source |
|---|---|
| CDS naming | CAP naming conventions: entity names capitalised and plural, type names capitalised and singular, element names starting in lower case |
| CDS and handler checks | CAP's ESLint plugin `@sap/eslint-plugin-cds` (`cds lint`) |
| UI5 code | SAPUI5 best practices and the UI5 linter |
| Fiori design | Rules FD-01 to FD-18 and FE-01 to FE-23 of the specifications |
| Project rules | This document |

## 2. Repository layout

```
close-workspace/
  app/
    services.cds              pulls in the annotation files of the apps
    workspace/                SAPUI5 freestyle app (TypeScript)
      webapp/
        controller/           <Name>.controller.ts
        view/                 <Name>.view.xml, <Name>.fragment.xml
        model/                formatter.ts, models.ts
        i18n/                 i18n.properties
        manifest.json
      ui5.yaml, ui5lint.config.mjs, tsconfig.json
    governance/               Fiori elements app
      annotations.cds
      webapp/
    admin/                    Fiori elements app
      annotations.cds
      webapp/
  db/
    schema.cds                domain model
    types.cds                 enum and reuse types
    labels.cds                @title and @description of the domain model
    sim-schema.cds            model of the simulated-mode data, namespace sim
    data/                     <namespace>-<Entity>.csv
    _i18n/                    i18n.properties for model texts
  srv/
    workspace-service.cds     service definition
    workspace-service.ts      its handler, same base name
    governance-service.cds
    governance-service.ts
    demo-admin-service.cds
    demo-admin-service.ts
    conversation/
    orchestrator/
    agents/<agent>/           <agent>.agent.ts, <tool-name>.tool.ts
    policy/
    impact/
    scheduler/
    ports/                    <name>.port.ts, interfaces only
    adapters/<kind>/          <name>.adapter.ts
    _i18n/                    i18n.properties for service texts and messages
  mock-bank/
  test/                       mirrors srv/, <name>.test.ts
  tools/lint/                 the lint kit
  docs/                       specifications, this document, fiori-deviations.md
  mta.yaml, xs-security.json, package.json, eslint.config.mjs, tsconfig.json
```

Service definitions and their handlers sit directly in `srv/`. This is the CAP convention: CAP finds `*.cds` files in the root of `db/`, `srv/` and `app/` without configuration, and matches a handler to a service definition by file name.

## 3. Naming at a glance

| Artefact | Convention | Example | Rule |
|---|---|---|---|
| CDS namespace | lower case, one word | `closeworkspace`, `sim` | CDS-01 |
| Entity | PascalCase, plural | `Proposals`, `ScheduledChecks` | CDS-02, CDS-03 |
| Type, aspect | PascalCase, singular | `ProposalStatus` | CDS-04 |
| Element | camelCase, key is `ID` | `goalText`, `ID` | CDS-05 |
| Boolean element | `is`, `has`, `can`, `should` + PascalCase | `isAnomaly` | CDS-07 |
| Association | to-one singular, to-many plural | `run`, `proposals` | CDS-08 |
| Enum value | UPPER_SNAKE_CASE | `WAITING_FOR_DECISION` | CDS-11 |
| Service | PascalCase + `Service` | `WorkspaceService` | SRV-01 |
| Action, function | camelCase, verb first | `approve`, `scheduleCheck` | SRV-04 |
| Event | PascalCase, past tense | `RunCompleted` | SRV-05 |
| CDS file | kebab-case | `workspace-service.cds` | FILE-01 |
| Service-layer TypeScript file | kebab-case with optional role suffix | `policy-engine.ts`, `ledger.port.ts` | FILE-02, FILE-03 |
| Folder | kebab-case | `mock-bank` | FILE-04 |
| View, fragment, controller | PascalCase + type suffix | `Workspace.view.xml`, `Workspace.controller.ts` | FILE-05 |
| Seed data file | `<namespace>-<Entity>.csv` | `closeworkspace-Settings.csv` | FILE-07 |
| Test file | same name as the unit + `.test.ts` | `test/policy/policy-engine.test.ts` | FILE-08 |
| TypeScript variable, function, parameter | camelCase | `openProposals` | TS-01 |
| TypeScript constant | UPPER_SNAKE_CASE or camelCase | `DEFAULT_LIMIT` | TS-01 |
| Class, interface, type alias, enum | PascalCase, no `I` prefix | `LedgerPort` | TS-01 |
| Enum member | UPPER_SNAKE_CASE | `AUTO_POST` | TS-01 |
| Control ID | lowerCamelCase ending in the control type | `approveButton` | UI-01 |
| Event handler | `on` + subject + event | `onApprovePress` | UI-02 |
| App ID | `<prefix>.<app>` | `com.example.closeworkspace.workspace` | UI-03 |
| Semantic object, action | PascalCase, lowerCamelCase | `CloseRun`, `manage` | UI-04 |
| Text key | lowerCamelCase segments with dots | `proposal.approve` | I18N-01 |
| MTA module, resource, service instance | `closeworkspace-` + kebab-case | `closeworkspace-srv` | BTP-02 |
| Scope, role template | `$XSAPPNAME.<Role>`, PascalCase | `$XSAPPNAME.Controller`, `Controller` | BTP-03 |
| Role collection | `Close Workspace ` + role | `Close Workspace Controller` | BTP-04 |
| Destination | UPPER_SNAKE_CASE, system first | `S4HC_AGENT_ACCRUALS` | BTP-08 |
| Commit subject | `type(scope): summary` | `feat(policy): hold postings above the limit` | GIT-01 |
| Branch | `type/scope-short-description` | `feat/policy-permission-intersection` | GIT-02 |

## 4. CDS domain model

| ID | Rule | Level | Enforced by |
|---|---|---|---|
| CDS-01 | Persistence definitions live in the namespace `closeworkspace`, or `sim` for simulated-mode data. | Must | `check-cds-model` |
| CDS-02 | Entity names are PascalCase without underscores. | Must | `cds lint` (`start-entities-uppercase`), `check-cds-model` |
| CDS-03 | Entity names are plural nouns. An uncountable name needs an entry in `entityPluralExceptions`. | Must | `check-cds-model` |
| CDS-04 | Types and aspects are PascalCase and singular. | Must (case), Should (singular) | `check-cds-model` |
| CDS-05 | Element names are camelCase. The only upper-case name is the technical key `ID`. | Must | `check-cds-model` |
| CDS-06 | An element does not repeat the name of its entity: `Runs.status`, not `Runs.runStatus`. | Must | `check-cds-model` |
| CDS-07 | Boolean elements start with `is`, `has`, `can` or `should`. | Should | `check-cds-model` |
| CDS-08 | A to-one association has a singular name, a to-many association a plural name. Associations are managed: no hand-written foreign key elements. | Must (names), Should (managed) | `check-cds-model`, review |
| CDS-09 | Entity and element names are not SQL reserved words. | Must | `check-cds-model`, `cds lint` (`no-db-keywords`, active for SQLite) |
| CDS-10 | Elements that hold a fixed set of codes use an enum type. The element names are listed in `enumElements`. | Must | `check-cds-model` |
| CDS-11 | Enum values are UPPER_SNAKE_CASE. | Must | `check-cds-model` |
| CDS-12 | Every entity has a key. Business data uses the `cuid` aspect, which gives a UUID named `ID`. Natural keys are for settings and code lists only. | Must (key), Should (kind) | `check-cds-model`, review |
| CDS-13 | Decimal elements declare precision and scale. String elements declare a length. | Must (Decimal), Should (String) | `check-cds-model` |
| CDS-14 | Entities are defined under `db/`. Services are defined directly in `srv/`. UI annotations are in `app/<app>/annotations.cds`. | Must | `check-cds-model`, review for annotations |
| CDS-15 | Use the reuse aspects and types of `@sap/cds/common` (`cuid`, `managed`, `Currency`). Do not redefine them. | Should | Review |
| CDS-16 | Labels are defined once, on the domain model, in `db/labels.cds`, with `@title: '{i18n>key}'`. Services and apps inherit them. | Must for Fiori elements services | `check-cds-model` (SRV-06) |

CAP's own recommended model rules also apply and run in the same ESLint pass: valid `@restrict` and `@requires` values, no ambiguous to-many associations, no `$`-prefixed names, valid CSV headers, and the rest of the recommended set.

**Example**

```cds
namespace closeworkspace;

using { cuid, managed } from '@sap/cds/common';

type ProposalStatus : String enum { PENDING; APPROVED; REJECTED; POSTED; REVERSED; }

entity Proposals : cuid, managed {
  run        : Association to Runs;
  title      : String(120);
  amount     : Decimal(15, 2);
  currency   : String(3);
  status     : ProposalStatus;
  isAnomaly  : Boolean default false;
  lines      : Composition of many ProposalLines on lines.proposal = $self;
}
```

## 5. Services and the service layer

| ID | Rule | Level | Enforced by |
|---|---|---|---|
| SRV-01 | Service names are PascalCase, end with `Service`, and have no namespace. | Must | `check-cds-model` |
| SRV-02 | Every service carries `@requires` or `@restrict`. Actions that change data name the role that may call them. | Must | `check-cds-model`, `cds lint` (`auth-*`) |
| SRV-03 | Services expose projections on domain entities. They define no persistence of their own. | Must | `check-cds-model` |
| SRV-04 | Actions and functions are camelCase and start with a verb. Actions change state. Functions only read. | Must (case), Should (verb, kind) | `check-cds-model`, review |
| SRV-05 | Events are PascalCase in past tense. | Must | `check-cds-model` |
| SRV-06 | Every element exposed by a service that feeds a Fiori elements app has a `@title` that is an i18n reference. | Must | `check-cds-model` |
| SRV-07 | One service per file. `WorkspaceService` is defined in `srv/workspace-service.cds` and implemented in `srv/workspace-service.ts`. | Must | `check-cds-model` |
| SRV-08 | One service per app. A service exposes only what its app needs. | Should | Review |
| SRV-09 | Services keep CAP's default path, derived from the service name (`/odata/v4/workspace`). No `@path` without an architecture decision. | Should | Review |
| SRV-10 | Architecture boundaries hold (table below). | Must | ESLint `no-restricted-imports` |
| SRV-11 | `srv/policy/` and `srv/impact/` are plain, deterministic TypeScript: no CAP, no model SDK, no clock, no random numbers, no environment access. Time and configuration come in as parameters. | Must | ESLint |
| SRV-12 | Configuration is read through `cds.env`, never through `process.env`. | Must | ESLint `no-restricted-properties` |
| SRV-13 | Handlers follow CAP's handler rules: no state in variables shared between requests, no deep imports from `@sap/cds`, no imports across service implementations, correct event names. | Must | `cds lint` JavaScript rules through ESLint |
| SRV-14 | Errors are raised with `req.error` or `req.reject`, a numeric status, and a text key from `srv/_i18n`. No thrown strings. | Should | Review |
| SRV-15 | Logging uses `cds.log('<module>')`. No `console`. | Must | ESLint `no-console` |

**Boundaries (SRV-10)**

| Folder | May import | Must not import |
|---|---|---|
| `srv/policy/`, `srv/impact/` | `srv/ports/` types | CAP, AI SDK, agent frameworks, adapters, agents, handlers, conversation, orchestrator |
| `srv/ports/` | Types only. No classes. | Adapters, agents, handlers, AI SDK, agent frameworks |
| `srv/agents/` | Ports, policy, impact, agent framework | Adapters, handlers, AI SDK |
| `srv/adapters/model/` | Ports, AI SDK | Agents, handlers |
| Other `srv/adapters/` | Ports, CAP | AI SDK, agent frameworks, agents, handlers |
| Everything else in `srv/` | Any of the above | AI SDK, agent frameworks |
| `app/*/webapp/` | SAPUI5 modules | `srv/`, `db/`, Node.js modules, jQuery |

The AI SDK is imported in `srv/adapters/model/` only. This keeps the model behind the `ModelPort`, which is what makes the scripted replay switch possible.

## 6. TypeScript

| ID | Rule | Level | Enforced by |
|---|---|---|---|
| TS-01 | Names follow the convention in section 3. Object keys that mirror OData payloads, query objects or annotations are exempt. | Must | ESLint `@typescript-eslint/naming-convention` |
| TS-02 | No `any`. Use `unknown` and narrow it. | Must | ESLint |
| TS-03 | Types are imported with `import type`. | Must | ESLint |
| TS-04 | Every promise is awaited, returned or explicitly handled. | Must | ESLint (type-aware) |
| TS-05 | No non-null assertion (`!`) outside tests. | Must | ESLint |
| TS-06 | No `console` in apps and services. | Must | ESLint |
| TS-07 | Keep units small: cyclomatic complexity up to 12, up to 4 parameters, nesting up to 4, files up to 400 lines. | Should | ESLint |
| TS-08 | Exported functions and methods in `srv/` declare parameter and return types. | Must | ESLint |
| TS-09 | The code compiles in strict mode with the options of the root `tsconfig.json`, and each freestyle app with its own `tsconfig.json`. | Must | `run-tsc` (`npm run lint:types`) |
| TS-10 | Formatting is Prettier's, with the settings of `.prettierrc.json`. No manual style debates. | Must | `prettier --check` |
| TS-11 | All source is TypeScript. JavaScript is for tooling and configuration files only. | Must | `check-files` (FILE-09) |

Toolchain note: the kit pins TypeScript 6.0, because `typescript-eslint` does not yet support TypeScript 7. Raise both together.

## 7. SAPUI5 and SAP Fiori

The design and development rules are in the specifications (FD-01 to FD-18, FE-01 to FE-23). This section adds the naming rules and shows which Fiori rules are automated.

| ID | Rule | Level | Enforced by |
|---|---|---|---|
| UI-01 | Control IDs are lowerCamelCase and end with the control type: `approveButton`, `runsList`, `evidenceTable`. | Must (case), Should (suffix) | `check-fiori`, review |
| UI-02 | Event handlers are named `on` + subject + event: `onApprovePress`, `onRunSelectionChange`. | Must | `check-fiori` |
| UI-03 | The app ID is `<appIdPrefix>.<app folder>`. | Must | `check-fiori` |
| UI-04 | Semantic objects are PascalCase, navigation actions lowerCamelCase. | Must | `check-fiori` |
| UI-05 | Apps import nothing from `srv/`, `db/` or Node.js. They talk to services through OData only. | Must | ESLint |
| UI-06 | `manifest.json` uses descriptor version 2. | Must | UI5 linter |
| UI-07 | Formatters live in `webapp/model/formatter.ts`. Controllers hold no formatting logic. | Should | Review |
| UI-08 | A controller extends `BaseController`, which holds the shared helpers for the i18n bundle, the router and models. | Should | Review |

**Automated Fiori gates**

| Fiori rule | What is checked | Tool |
|---|---|---|
| FE-01 | `minUI5Version` is pinned | `check-fiori` |
| FE-02 | Libraries in the manifest and XML namespaces in views are on the allow-list | `check-fiori` |
| FE-03 | No HTML in views, no `core:HTML`, no DOM access, no jQuery | `check-fiori`, ESLint |
| FE-04 | No style sheets, no `style` attributes, only standard margin, padding and density classes | `check-fiori`, ESLint |
| FE-05 | No theme and no colour literals in the app | `check-fiori` |
| FE-08 | Launchpad navigation target is declared | `check-fiori` |
| FE-09 | Compact and cozy density are declared | `check-fiori` |
| FE-11, FE-22 | No `FlexibleColumnLayout`, `ToolPage` or `SimpleForm` | `check-fiori` |
| FE-14 | No `alert`, `confirm` or `prompt` | ESLint |
| FE-17 | Data sources are OData V4 | `check-fiori` |
| FE-18 | No text literals in views, controllers or the manifest title | `check-fiori`, ESLint, `check-i18n` |
| FE-21 | Icons come from the SAP icon font | `check-fiori` |
| FE-23 | Fiori elements apps contain no freestyle views or controllers | `check-fiori` |
| Deprecated and legacy APIs | All UI5 linter rules | UI5 linter |

The remaining Fiori rules need a person: layout quality, action placement, message wording, accessibility with keyboard and screen reader, and the theme and size walkthroughs.

## 8. Translatable texts

| ID | Rule | Level | Enforced by |
|---|---|---|---|
| I18N-01 | Keys are lowerCamelCase segments separated by dots, from general to specific: `proposal.approve`, `plan.step.status`. | Must | `check-i18n` |
| I18N-02 | Every key has a text-type comment on the line above: `#XBUT: Approve a proposal`. The comment tells a translator what the text is for. | Must | `check-i18n` |
| I18N-03 | A key is defined once per file. | Must | `check-i18n` |
| I18N-04 | Every key used in a view, controller, manifest or CDS file is defined. | Must | `check-i18n` |
| I18N-05 | Unused keys are removed. | Should | `check-i18n` |
| I18N-06 | No key has an empty text. | Must | `check-i18n` |
| I18N-07 | A translation file defines no key that the default file lacks, and should define all of them. | Must (extra), Should (missing) | `check-i18n` |
| I18N-08 | Sentences are never built by concatenation. Use placeholders `{0}`, `{1}`. | Must | Review |
| I18N-09 | App texts are in `app/<app>/webapp/i18n/`. Model and service texts are in `db/_i18n/` and `srv/_i18n/`. | Must | `check-files`, `check-i18n` |

Text types in use: `XBUT` button, `XTIT` title, `XFLD` field label, `XCOL` column header, `XMSG` and `YMSG` message, `XTOL` tooltip, `XLNK` link, `XACT` accessibility text, `XGRP` group title, `XLST` list item, `XSEL` selection value, `YINS` instruction, `NOTR` not to be translated.

## 9. Files and folders

| ID | Rule | Level | Enforced by |
|---|---|---|---|
| FILE-01 | CDS files are kebab-case. | Must | `check-files`, `check-cds-model` |
| FILE-02 | TypeScript files in `srv/`, `mock-bank/` and `test/` are kebab-case, with at most one role suffix. | Must | `check-files` |
| FILE-03 | Role suffixes are mandatory by folder: `.port.ts` in `srv/ports/`, `.adapter.ts` in `srv/adapters/`, `.agent.ts` or `.tool.ts` in `srv/agents/`. | Must | `check-files` |
| FILE-04 | Folders are kebab-case. Folders inside a UI5 `webapp` are lowerCamelCase. | Must | `check-files` |
| FILE-05 | Views, fragments and controllers are PascalCase with their type suffix, in `view/` and `controller/`. Every controller has a view of the same name. | Must | `check-files` |
| FILE-06 | Text files are `i18n.properties` and `i18n_<language>.properties` in `webapp/i18n/`. Every app has the default file. | Must | `check-files` |
| FILE-07 | Seed data files are `<namespace>-<Entity>.csv` in `db/data/`. | Must | `check-files`, `cds lint` (`valid-csv-header`) |
| FILE-08 | Tests are in `test/`, mirror the `srv/` structure, and end with `.test.ts`. Helpers are in `test/helpers/`, data in `test/fixtures/`. | Must | `check-files` |
| FILE-09 | No JavaScript files in `srv/`, `test/` or an app's `webapp/`. | Must | `check-files` |
| FILE-10 | An app folder is one lower-case word and is registered in `tools/lint/standards.config.mjs`. | Must (name), Should (registered) | `check-files` |
| FILE-11 | Every app folder has a `ui5.yaml`. A freestyle app also has `tsconfig.json` and `ui5lint.config.mjs`. | Must | `check-files` |

## 10. SAP BTP artefacts

| ID | Rule | Level | Enforced by |
|---|---|---|---|
| BTP-01 | The MTA ID is `closeworkspace`. The MTA version is a semantic version. | Must | `check-btp` |
| BTP-02 | MTA modules, resources and service instances are kebab-case and start with `closeworkspace-`. | Must | `check-btp` |
| BTP-03 | `xsappname` is `closeworkspace`. Scopes are `$XSAPPNAME.<Role>` with a description. Role templates are PascalCase and match their scope. | Must | `check-btp` |
| BTP-04 | Role collections start with `Close Workspace `. | Must | `check-btp` |
| BTP-05 | `package.json` is private, pins the Node.js version, and pins dependency ranges. | Must | `check-btp` |
| BTP-06 | No credentials in `package.json` or any committed file. Credentials come from service bindings and destinations. | Must | `check-btp`, review |
| BTP-07 | `.gitignore` lists `default-env.json`, `.env` and `.cdsrc-private.json`. | Must | `check-btp` |
| BTP-08 | Destinations are UPPER_SNAKE_CASE and start with the target system: `S4HC_AGENT_ACCRUALS`, `BANK_MOCK`. One destination per agent user. | Must | Review |
| BTP-09 | `package-lock.json` is committed. Dependencies are raised deliberately, with one commit of type `build(deps)`. | Must | Review |
| BTP-10 | Roles in CDS (`@requires`) use the role template names of `xs-security.json` exactly: `Controller`, `Auditor`, `Viewer`, `DemoAdmin`. | Must | Review |

## 11. Tests

| ID | Rule | Level | Enforced by |
|---|---|---|---|
| TEST-01 | Tests follow FILE-08. | Must | `check-files` |
| TEST-02 | A `describe` block names the unit. A test name states the behaviour: `holds an entry above the limit`. One behaviour per test. | Should | Review |
| TEST-03 | Every behavioural rule R1 to R13 has at least one test whose name contains the rule ID. | Must | Review |
| TEST-04 | Service tests run through `cds.test` against in-memory SQLite with the seed data. No test calls a live system or a live model. | Must | Review |
| TEST-05 | Each Must intent has one UI journey, named with the intent ID. | Must | Review |
| TEST-06 | Policy and impact code is tested without mocks, because it is pure (SRV-11). | Should | Review |

## 12. Git

| ID | Rule | Level | Enforced by |
|---|---|---|---|
| GIT-01 | Commit subjects are `type(scope): summary`, at most 72 characters, lower-case imperative, no period. Types and scopes are listed in `standards.config.mjs`. | Must | `check-commit-msg` in the `commit-msg` hook and the pipeline |
| GIT-02 | Branches are `type/scope-short-description` in kebab-case. | Should | Review |
| GIT-03 | A pull request passes `npm run lint` and the tests, and names the intent or rule IDs it implements. | Must | Pipeline, review |

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `ci`, `perf`.
Scopes: `workspace`, `governance`, `admin`, `srv`, `conversation`, `orchestrator`, `agents`, `policy`, `impact`, `scheduler`, `adapters`, `db`, `mock-bank`, `lint`, `docs`, `deploy`, `deps`.

## 13. The lint kit

### 13.1 Commands

| Command | What it runs |
|---|---|
| `npm run lint` | Every step below, with one summary. Exit code 1 if any step fails. |
| `npm run lint:types` | TypeScript compiler in strict mode, without output, for the service layer and for each freestyle app (TS-09) |
| `npm run lint:es` | ESLint: TypeScript rules, architecture boundaries, CAP's CDS and handler rules, seed data headers |
| `npm run lint:format` | Prettier check. `npm run format` fixes. |
| `npm run lint:cds` | `check-cds-model`: CDS-01 to CDS-14, SRV-01 to SRV-07 |
| `npm run lint:files` | `check-files`: FILE-01 to FILE-11 |
| `npm run lint:fiori` | `check-fiori`: the automated Fiori gates and UI-01 to UI-04 |
| `npm run lint:i18n` | `check-i18n`: I18N-01 to I18N-07 |
| `npm run lint:btp` | `check-btp`: BTP-01 to BTP-07 |
| `npm run lint:ui5` | UI5 linter in every app |
| `npm run lint:selftest` | Proves that every check still catches what it should (13.4) |
| `node tools/lint/run.mjs --only cds,files` | Selected steps. `--list` shows the keys. |

Hooks in `.githooks/` run the fast checks before a commit and check the commit message. `npm install` activates them.

### 13.2 Files

| File | Purpose |
|---|---|
| `eslint.config.mjs` | ESLint flat configuration, in five layers: CDS, TypeScript, service layer, apps, tests and tooling |
| `tools/lint/standards.config.mjs` | All project-specific values: namespaces, app ID prefix, allow-lists, reserved words, commit scopes. Change settings here, not in the scripts. |
| `tools/lint/check-*.mjs` | The custom checks |
| `tools/lint/run.mjs` | Runs all steps |
| `tools/lint/selftest.mjs`, `selftest/fixtures.mjs` | Self-test and its fixture projects |
| `tools/lint/run-tsc.mjs`, `run-ui5lint.mjs` | Run the compiler and the UI5 linter once per project |
| `tools/lint/templates/` | `ui5lint.config.mjs` and `app-tsconfig.json`, to copy into each freestyle app folder |
| `tsconfig.json` | Strict compiler settings for `srv/`, `test/` and `mock-bank/`. CAP's types are wired in through `"types": ["@cap-js/cds-types"]`. |
| `.github/workflows/lint.yml` | Pipeline example |

### 13.3 Installing the kit in the project

1. Copy `eslint.config.mjs`, `tsconfig.json`, `.prettierrc.json`, `.prettierignore`, `.editorconfig`, `.githooks/`, `.github/` and `tools/lint/` into the repository root.
2. Merge the `scripts` and `devDependencies` of the kit's `package.json` into the project's `package.json`.
3. Set `appIdPrefix` in `tools/lint/standards.config.mjs` to your own reverse-domain prefix.
4. Copy the two templates into each freestyle app folder and replace `APP_NAME`.
5. Run `npm install`, then `npm run lint:selftest`. The self-test must pass before the first real lint run.

Versions the kit was built and tested with: Node.js 22.23, ESLint 10.15, `typescript-eslint` 8.73, TypeScript 6.0.3, `@sap/cds` 10.2.2, `@sap/eslint-plugin-cds` 4.2.5, UI5 linter 1.23.10, `@sapui5/types` 1.154, Prettier 3.10.

### 13.4 Changing a rule

1. Change the standard in this document first.
2. Change the check or the configuration.
3. Add a passing case to the `good` fixture and a failing case to the `bad` fixture, and add the rule ID to `expected`.
4. Run `npm run lint:selftest`. It must pass before the change is committed.

### 13.5 Suppressions and deviations

- A lint finding is fixed, not suppressed.
- If a rule cannot be met, the suppression comment states the reason on the same line: `// eslint-disable-next-line <rule> -- <reason>`.
- A suppression of a Must rule also needs a row in the deviation log: `docs/fiori-deviations.md` for FD and FE rules, `docs/deviations.md` for all others. One row holds the rule ID, the file, the reason, the approver and the date.
- Rules are never switched off globally to make a build pass.

### 13.6 Coding agents

A coding agent that works in this repository follows this document and runs `npm run lint` before it reports a task as done. A failing check is fixed, not suppressed. For Claude Code this is set up in the repository: `CLAUDE.md` and `.claude/rules/` carry the rules per layer, and a Stop hook runs the lint kit whenever Claude finishes an iteration. See `docs/claude-code-setup.md`.

### 13.7 Limits of the automation

- **Plural check (CDS-03, CDS-04, CDS-08):** a heuristic on the last word of the name. It reads a trailing `s` as plural, with exceptions for `ss`, `us` and `is`.
- **Reserved words (CDS-09):** a curated list for SAP HANA and SQLite, not the databases' full lists.
- **Views (check-fiori):** a tag and attribute scanner, not a full XML parser. It does not evaluate expression bindings or XML templating.
- **Text literals (FE-18):** any value containing `{` counts as bound.
- **Unused keys (I18N-05):** keys built at run time, such as `status.` + code, are reported as unused. This is why the rule is a warning.

## 14. Alignment of the v0.4 specifications

Running the kit against the data model and services printed in the architecture specification v0.4 gives 104 errors and 2 warnings. Until the specifications are updated, this document takes precedence.

| Finding | Rule | Change needed |
|---|---|---|
| Service files are placed in `srv/services/` | CDS-14, SRV-07 | Define services directly in `srv/`, as in section 2 |
| `AgentRegistry`, `ModelUsage`, `Config` are not plural | CDS-03 | Rename to `Agents`, `ModelUsageStats`, `Settings` |
| `Messages.messageIntent`, `Config.configKey`, `Config.configValue` repeat the entity name | CDS-06 | Rename to `intent`, `code`, `value` |
| 13 code elements are plain strings: every `status`, plus `mode`, `scenario`, `role`, `messageIntent`, `reasonCode`, `actorType` | CDS-10 | Introduce enum types in `db/types.cds`, for example `RunStatus`, `ProposalStatus`, `ActorType` |
| `Messages.quickDecision`, `Proposals.anomaly` | CDS-07 (warning) | Rename to `isQuickDecision`, `isAnomaly` |
| No labels on the 85 elements exposed to the two Fiori elements apps | SRV-06, CDS-16 | Add `db/labels.cds` with `@title` and the text keys |
| Stack table names ESLint 9 | Toolchain | The kit uses ESLint 10, which CAP 10 and `typescript-eslint` 8 both accept |
| Manifest descriptor version is not stated | UI-06 | State descriptor version 2, which the UI5 linter requires |

## 15. References

- SAP Learning, "Defining Domain Models" (CAP naming conventions for entities, types and elements): https://learning.sap.com/courses/introduction-to-sap-cloud-application-programming-model/defining-domain-models_b61bc48e-26e6-4095-aa03-122bdffed06a
- CAP documentation, CDS Lint: https://cap.cloud.sap/docs/tools/cds-lint/
- CAP documentation, CDS Lint rules reference: https://cap.cloud.sap/docs/tools/cds-lint/rules/
- CAP documentation, rule `start-entities-uppercase`: https://cap.cloud.sap/docs/tools/cds-lint/rules/start-entities-uppercase/
- CAP release notes: https://cap.cloud.sap/docs/releases/
- UI5 linter: https://github.com/SAP/ui5-linter
- UI5 documentation, best practices for developers: https://ui5.github.io/docs/03_Get-Started/best-practices-for-developers-28fcd55.html
- ESLint, configuration files: https://eslint.org/docs/latest/use/configure/configuration-files
- Intent Specification v0.4 and Technical Solution Architecture Specification v0.4, in `docs/`
