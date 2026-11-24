---
id: F-01
title: Project skeleton
priority: Must
status: approved
sources: architecture-spec 1.1, 1.2, 14 (WP1); development-standards 2, 9, 10, 11, 13.3, 14; CLAUDE.md corrections to architecture v0.4
---

# F-01 Project skeleton

## Intent

The developer who builds the Close Workspace, and every coding agent after them, wants one repository that already has the shape of the finished solution: a CAP Node.js service in TypeScript, a test runner, and the three app folders for Close Workspace, Agent Governance and Demo Administration, with the lint kit and the test suite both passing. Every later work item (F-02 onwards) adds content into this frame instead of arguing about structure, and the quality gates of the definition of done (`npm run lint`, `npm test`) can be applied from the first commit. Nothing is visible to the audience of the demo yet.

## Scope

In scope:

- The repository becomes a CAP Node.js project (CAP 10) written in TypeScript in strict mode, laid out as in development-standards section 2, with the corrections listed in `CLAUDE.md` (services directly in `srv/`, not `srv/services/`).
- Local run with the in-memory SQLite database and no bound BTP service (architecture 1.1, "Database" and "Development tools").
- Jest as the test runner for the service layer, wired so that a test can start the CAP server through `cds.test` (TEST-04), with test files under `test/` mirroring `srv/` (FILE-08).
- The three app folders `app/workspace` (freestyle, TypeScript), `app/governance` and `app/admin` (Fiori elements), each holding what FILE-10 and FILE-11 require, and registered in the lint kit settings (already present).
- The lint kit installation steps of standards 13.3 that are not yet done, including a passing lint self-test.
- `npm run lint` and `npm test` both exit with code 0 on this otherwise empty project.

Out of scope (and the work item that covers it):

- Domain model, enum types, labels, seed data, service entities: F-02.
- Ports, simulated adapters, mock bank service and its folder content: F-03.
- Policy engine, impact calculator, trace, proposal lifecycle: F-04.
- Orchestrator, model port, AI SDK dependencies, LangGraph, `zod`: F-05.
- Close Workspace app frame (launchpad app, three panes, polling, views, controllers): F-06.
- Fiori elements pages and annotations of Agent Governance and Demo Administration: INT-15 and INT-10.
- Deployment descriptor, security descriptor, role collections, launchpad content, application router: F-08.
- App descriptors and app content of the three app folders: F-06, INT-10, INT-15.
- Service roles and authorisation: F-08.
- UI journey tests with OPA5 or wdi5 (TEST-05): the first Must intent that has a screen (INT-01 onwards).
- Live adapters and hybrid profile with bound BTP services: F-09.

## Acceptance criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-1 | A fresh clone of the branch | `npm ci` is run | It exits with code 0, uses the committed lock file (BTP-09), and the git hooks are active: `git config core.hooksPath` prints `.githooks`. |
| AC-2 | The installed project | `npm run lint:selftest` is run | It exits with code 0 (standards 13.3, step 5). |
| AC-3 | The installed project | `npm run lint` is run | All nine steps (es, format, types, cds, files, fiori, i18n, btp, ui5) report passed, the summary shows 0 errors, and the exit code is 0. No suppression comment and no change under `tools/lint/` is part of the change set (`git diff main --stat -- tools/lint` prints nothing). |
| AC-4 | The installed project | `npm test` is run | Jest runs, reports at least 1 passing test suite and 0 failed, and exits with code 0. |
| AC-5 | The installed project | The test suite of AC-4 runs | At least one test starts the CAP server in process through `cds.test` against in-memory SQLite and receives HTTP status 200 from the server root `/` and from the service roots of `WorkspaceService`, `GovernanceService` and `DemoAdminService`; no network call leaves the machine (TEST-04). |
| AC-6 | The installed project | `npx cds watch` is run and `http://localhost:4004/` is opened | The server starts without an error in the log, uses the in-memory SQLite database (log line names `sqlite` and `:memory:`), the index page answers with HTTP 200 and lists the three services `WorkspaceService`, `GovernanceService` and `DemoAdminService`, none with an entity. |
| AC-7 | The installed project | `npx tsc --noEmit -p .` and `npm run lint:types` are run | Both exit with code 0 in strict mode (TS-09); TypeScript test and service files exist and are compiled, there are no `.js` files in `srv/`, `test/` or any `webapp/` (TS-11, FILE-09). |
| AC-8 | The repository root | The folders under `app/` are listed | Exactly `workspace`, `governance` and `admin` exist; `npm run lint:files` reports no FILE-10 or FILE-11 finding and no "unregistered app" warning for them. |
| AC-9 | `app/workspace` | `npm run lint:ui5` and `npm run lint:types` are run | Both pass. `app/workspace` has its own UI5-linter configuration; its compiler configuration arrives with F-06, because FILE-11 is checked once a `webapp/` exists (plan decision 1). No app folder holds an app descriptor yet (open question 3). |
| AC-10 | The project manifest of the repository | `npm run lint:btp` is run | It passes: the project is private, the Node.js range is `>=22.12` (BTP-05, open question 1), `npm test` and `npx cds watch` work through a TypeScript loader (evidence on Node.js 24, plan decision 5), dependency ranges are pinned, and the ignore list contains `default-env.json`, `.env` and `.cdsrc-private.json` (BTP-07). |
| AC-11 | The whole change set | `git grep -n -i -E "joule|sap (ai|business|build) .*product"` and a search for credentials (`password`, `clientsecret`, `BEGIN PRIVATE KEY`) are run over the changed files | No match presents the prototype as an SAP product and no credential is committed (non-negotiables in `CLAUDE.md`, BTP-06). |
| AC-12 | The feature branch | `git log main..HEAD --format=%s` is read | Every commit subject follows GIT-01, the branch name follows GIT-02 (`feature/YYYYMMDD_NN_<summary>`), and every new dependency arrives in its own commit of type `build(deps)` (BTP-09). The new dependencies are exactly the stack of architecture 1.1 (including `@cap-js/sqlite`, `@cap-js/hana`, `@cap-js/cds-typer`, `@sap/xssec`, `express`), `@cap-js/cds-test`, `@sap/cds-dk`, Jest with its TypeScript transform, and the TypeScript loader (open questions 1 and 5, plan decision 2). |
| AC-13 | The file `docs/work/STATUS.md` | The work item is finished | The F-01 row shows status `Done`, with the table format unchanged. |

## Rules that apply

| Rule | What it means for this work item |
|---|---|
| R1 to R13 | None apply: no behaviour of the demo is built. TEST-03 starts to bite from F-04. |
| FD-01 to FD-18 | None apply: no screen is built. |
| TS-09, TS-11 | Strict compilation for the service layer and for the freestyle app with its own configuration; all source is TypeScript. |
| FILE-08, FILE-09, FILE-10, FILE-11 | Test placement, no JavaScript in source folders, app folder names and the files each app folder needs. |
| UI-03, UI-06, FE-01, FE-09, FE-17 | Do not apply yet: no app descriptor in F-01 (open question 3). |
| TEST-01, TEST-04 | Tests in `test/`, service tests through `cds.test` on in-memory SQLite, no live system. |
| BTP-05, BTP-06, BTP-07, BTP-09 | Private project, pinned Node.js and dependency ranges, no credentials, committed lock file, dependencies in `build(deps)` commits. |
| GIT-01, GIT-02 | Commit subjects and branch name. |
| Standards 13.3, 13.5 | Kit installation steps; findings are fixed, never suppressed, and `tools/lint/` is not changed without the user's approval. |
| CLAUDE.md corrections | Services directly in `srv/`; ESLint 10 (not 9); manifest descriptor version 2. |

## Demo check

Scene: none. This item is invisible to the audience. The developer does: clone, `npm ci`, `npm run lint`, `npm test`, `npx cds watch`. The developer sees: nine passed lint steps, a green test run, and the CAP index page at `http://localhost:4004/`. No seed-data values are involved (they arrive with F-02).

## Open questions

| # | Question | Options | Answer |
|---|---|---|---|
| 1 | Which Node.js version is pinned? Architecture 1.1 names Node.js 24 LTS and says TypeScript service handlers run without extra tooling from CAP 10.2 on Node.js 24 and above; the current project manifest says `>=22.12`, and the lint kit was tested with Node.js 22.23 (standards 13.3). The choice decides whether TypeScript handlers need a separate runtime loader. | (a) Pin Node.js 24 (`>=24 <25`), rely on native TypeScript execution; (b) keep `>=22.12` and add a TypeScript loader for run and test; (c) allow `^22.12 \|\| ^24` and support both. | (b) Keep `>=22.12`; TypeScript runs through a loader for run and test. |
| 2 | Which reverse-domain app ID prefix is used (UI-03)? `tools/lint/standards.config.mjs` still holds the placeholder `com.example.closeworkspace`, which standards 13.3 step 3 says to replace; changing the kit needs the user's approval. | (a) Keep the placeholder for the prototype; (b) the user gives the partner's own prefix and approves the one-line change in the kit settings. | Resolved: the kit settings hold the partner prefix `vn.fsoft.sap.ai.closeworkspace` as an uncommitted change made by the user; it is committed to `main` before the F-01 branch is opened, so the F-01 change set touches nothing under the kit. |
| 3 | What do the three app folders contain in F-01? FILE-11 needs the build configuration (and, for the freestyle app, compiler and UI5-linter configuration), but a Fiori elements app cannot be meaningfully generated before its service has entities (F-02), and the UI5 linter may fail on a folder with no app descriptor. | (a) Only the files FILE-11 requires, no app descriptor; (b) a minimal app per folder with descriptor version 2, pinned minimum UI5 version, i18n title and no pages, so that UI-03, UI-06, FE-01, FE-09 are checked from the start; (c) (b) for the freestyle app only, (a) for the two Fiori elements apps. | (a) Only the files FILE-11 requires; no app descriptor in F-01. |
| 4 | Does F-01 define the three services (`WorkspaceService`, `GovernanceService`, `DemoAdminService`) as empty definitions, or does it define no CDS model at all? Without any model, the CAP server may refuse to start or serve nothing, which affects AC-5 and AC-6. | (a) No CDS in F-01; AC-5 and AC-6 then only check that the server starts; (b) three empty services with their roles left to F-08; (c) one placeholder service, replaced in F-02. | (b) Three empty services; roles in F-08, entities from F-02. |
| 5 | Which new dependencies are approved for F-01? Each needs the user's approval (`CLAUDE.md`). Candidates from architecture 1.1 and this item: Jest, a TypeScript transform for Jest, `@cap-js/sqlite`, `@cap-js/hana`, `cds-typer`, `@sap/xssec`, `express`. | (a) Only what F-01 needs to run and test locally (Jest, its TypeScript transform, `@cap-js/sqlite`); the others with the items that use them (`cds-typer` with F-02, `@cap-js/hana` and `@sap/xssec` with F-08); (b) the full stack of architecture 1.1 now, to fix versions once. | (b) The full stack of architecture 1.1 now, plus the TypeScript loader that answer 1 needs. |
