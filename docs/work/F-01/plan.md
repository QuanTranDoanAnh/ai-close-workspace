---
id: F-01
branch: feature/YYYYMMDD_NN_project-skeleton
parallel-safe: yes
---

# Plan for F-01

## Approach

The repository already holds the lint kit, the root `tsconfig.json`, `eslint.config.mjs` and the git hooks (standards 13.3, steps 1 to 3 done). F-01 adds the CAP 10 project around them: the dependency stack of architecture 1.1, three empty service definitions with TypeScript handlers directly in `srv/` (CLAUDE.md correction, SRV-07), Jest with `ts-jest` for `cds.test` service tests, `tsx` as the TypeScript loader for `cds watch` on Node.js 22.12 or later (open question 1), and the three app folders with only the files FILE-11 asks for, without a `webapp/` folder (open question 3). There is no comparable feature yet; the patterns come from the lint kit itself (`tools/lint/templates/`, `check-files.mjs`, `check-cds-model.mjs`) and standards section 2. Nothing outside `tools/lint/` is changed in the kit.

Findings from the kit that shape the plan (read from the scripts, not assumed):

- `check-fiori.mjs` reports FE-06 (missing `manifest.json`) for every app that has a `webapp/` folder, and `check-files.mjs` / `run-ui5lint.mjs` only look at apps that have one. So "no app descriptor" means "no `webapp/` folder" in F-01.
- `run-tsc.mjs` compiles `app/<app>/tsconfig.json` whenever the file exists. The kit template includes only `./webapp/**/*`; with no `webapp/` sources `tsc` stops with `error TS18003: No inputs were found in config file` (reproduced with the installed TypeScript 6.0.3 in a scratch folder, with and without an empty `webapp/i18n/`). See decision 1.
- `check-cds-model.mjs` reports SRV-02 for a service without `@requires` or `@restrict`. See decision 3.
- `cds.test` lives in `@cap-js/cds-test` (`@sap/cds` 10.2.2 `lib/test/cds-test.js` only re-exports it), and `cds watch` is a command of `@sap/cds-dk`, which is not installed. See decision 2.
- `tools/lint/standards.config.mjs` with the prefix `vn.fsoft.sap.ai.closeworkspace` is an uncommitted change in the working tree, not on `main`. AC-3 requires `git diff main --stat -- tools/lint` to print nothing. See decision 4.

## Contract change

New files, no entities, no actions, no types:

```cds
// srv/workspace-service.cds
@requires: 'authenticated-user'
service WorkspaceService {}

// srv/governance-service.cds
@requires: 'authenticated-user'
service GovernanceService {}

// srv/demo-admin-service.cds
@requires: 'authenticated-user'
service DemoAdminService {}
```

- No namespace (SRV-01), one service per file, file name equal to the kebab-case service name (SRV-07). Default paths: `/odata/v4/workspace`, `/odata/v4/governance`, `/odata/v4/demo-admin`. No `@path`.
- `authenticated-user` is CAP's pseudo-role, not an application role; the roles `Controller`, `Auditor`, `DemoAdmin` come with F-08 (open question 4). Decision 3: confirmed.
- Handlers `srv/workspace-service.ts`, `srv/governance-service.ts`, `srv/demo-admin-service.ts`: each one class that extends `cds.ApplicationService`, named as the service, exported as default, `init()` returns `super.init()`. No logic.
- No `db/` model: the domain model is F-02.

Project manifest (`package.json`) after F-01, ranges with the floor verified by `npm view` on 2026-11-25:

| Section | Package | Range | Why |
|---|---|---|---|
| dependencies | `@sap/cds` | `^10.2.2` | moved from devDependencies, runtime of the service (arch 1.1) |
| dependencies | `express` | `^5.3.0` | arch 1.1; `@sap/cds` accepts `^4.22.1 \|\| ^5` |
| dependencies | `@cap-js/hana` | `^3.2.0` | arch 1.1, production database (peer `@sap/cds ^10`) |
| dependencies | `@sap/xssec` | `^4.16.0` | arch 1.1, security (engines `>=18`) |
| devDependencies | `@cap-js/sqlite` | `^3.1.3` | arch 1.1, in-memory database for local run and tests (peer `@sap/cds ^10`) |
| devDependencies | `@cap-js/cds-typer` | `^0.41.1` | arch 1.1 "cds-typer". The npm package `cds-typer` (0.1.0) is unrelated and must not be used. Peers `@sap/cds >=8`, `@cap-js/cds-types >=0.9` (0.20 present) |
| devDependencies | `@sap/cds-dk` | `^10.2.1` | provides `cds watch` and `cds-tsx` (arch 1.1 "Development tools"). approved (decision 2) |
| devDependencies | `@cap-js/cds-test` | `^1.0.2` | provides `cds.test` (arch 1.1 "Tests"). Approved (decision 2) |
| devDependencies | `jest` | `^30.5.2` | test runner; engines include `^22.0.0 \|\| >=24.0.0`; matches `@types/jest ^30` already present |
| devDependencies | `ts-jest` | `^29.4.15` | Jest TypeScript transform; peers `jest ^29 \|\| ^30`, `typescript >=4.3 <7` (6.0.3 present); Babel peers optional |
| devDependencies | `tsx` | `^4.23.15` | TypeScript loader for `cds watch` (used by `cds-tsx`), engines `>=18` |

Choice of transform: `ts-jest` over `@swc/jest` (0.2.39) because it uses the project's own TypeScript compiler and `tsconfig.json`, needs no native binary, and its peer range covers TypeScript 6. Choice of loader: `tsx` because `@sap/cds-dk` ships the `cds-tsx` binary for it.

New `package.json` content besides the dependencies:

- `scripts.test`: `jest`; `scripts.watch`: `cds-tsx watch`.
- `jest` key (no separate config file, so no JavaScript or extra TypeScript loader for the config): `testEnvironment: "node"`, `roots: ["<rootDir>/test"]`, `testMatch: ["**/*.test.ts"]`, `transform: { "^.+\\.ts$": ["ts-jest", { "tsconfig": "<rootDir>/tsconfig.json" }] }`.
- No `cds` configuration key: with `@cap-js/sqlite` installed, CAP's development profile defaults to SQLite `:memory:`. Add `cds.requires.db` only if the AC-6 log line does not name `sqlite` and `:memory:`.
- `private: true`, `engines.node: ">=22.12"`, existing scripts and `prepare` unchanged.

## Tasks

| # | Owner | Task | Files | Covers |
|---|---|---|---|---|
| 1 | backend-developer | Dependencies: install the eleven packages of the contract table one by one with `npm install --save[-dev] <pkg>@<version>` (and move `@sap/cds` to dependencies), each followed by its own commit `build(deps): add <pkg> <version>` with `package.json` and `package-lock.json` only. Then add `scripts.test`, `scripts.watch` and the `jest` key in a separate commit `build(deps): configure jest and the tsx watch script`. Run `npm run format` on `package.json` before each commit. | `package.json`, `package-lock.json` | AC-1, AC-10, AC-12 |
| 2 | test-author | Write the service tests of "Tests to write first". They fail at this point because the services do not exist (404). | `test/workspace-service.test.ts`, `test/governance-service.test.ts`, `test/demo-admin-service.test.ts` | AC-4, AC-5, AC-7 |
| 3 | backend-developer | Contract: the three service definitions and their handler classes exactly as in "Contract change". | `srv/workspace-service.cds`, `srv/workspace-service.ts`, `srv/governance-service.cds`, `srv/governance-service.ts`, `srv/demo-admin-service.cds`, `srv/demo-admin-service.ts` | AC-4, AC-5, AC-6, AC-7 |
| 4 | ui-developer | App folders: `app/workspace/ui5.yaml`, `app/governance/ui5.yaml`, `app/admin/ui5.yaml` (`specVersion: "4.0"`, `type: application`, `metadata.name` `vn.fsoft.sap.ai.closeworkspace.<app>`); `app/workspace/ui5lint.config.mjs` copied unchanged from `tools/lint/templates/`. No `app/workspace/tsconfig.json`: it arrives with F-06 (decision 1). No `webapp/` folder, no `manifest.json`, no other app. | `app/workspace/ui5.yaml`, `app/workspace/ui5lint.config.mjs`, `app/governance/ui5.yaml`, `app/admin/ui5.yaml` | AC-8, AC-9 |
| 5 | backend-developer | Kit installation check and green gates: `npm ci` on a clean `node_modules`, `git config core.hooksPath`, `npm run lint:selftest`, `npm run lint`, `npm test`, `npx tsc --noEmit -p .`, `npx cds watch` and `npm run watch` with the index page and the log line; `git diff main --stat -- tools/lint`; the product-name and credential searches of AC-11; `git log main..HEAD --format=%s`. Record commands and output in `verification.md`. Fix causes, never suppress. | `docs/work/F-01/verification.md` | AC-1, AC-2, AC-3, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-12 |
| 6 | backend-developer | Set the F-01 row in `docs/work/STATUS.md` to `Done` after verification passes, table format unchanged. | `docs/work/STATUS.md` | AC-13 |

Order: 1, then 2 and 4 in parallel, then 3, then 5, then 6. Task 4 depends on nothing in tasks 1 to 3; its only open input is decision 1.

## Tests to write first

All three files use `cds.test(<project root>)` once per file, send requests with the mocked user `alice` (basic auth, empty password), and use Jest's `expect`. Test names carry `(F-01 AC-n)`.

| Criterion or rule | Test file | What the test asserts |
|---|---|---|
| AC-5, TEST-04 | `test/workspace-service.test.ts` | `describe('WorkspaceService')`: (a) `serves the index page (F-01 AC-5)`: `GET /` returns 200; (b) `serves the service root (F-01 AC-5)`: `GET /odata/v4/workspace` returns 200; (c) `runs on in-memory SQLite (F-01 AC-5)`: `cds.env.requires.db.kind` is `sqlite` and its `credentials.url` is `:memory:`. |
| AC-5 | `test/governance-service.test.ts` | `describe('GovernanceService')`: `serves the service root (F-01 AC-5)`: `GET /odata/v4/governance` returns 200. |
| AC-5 | `test/demo-admin-service.test.ts` | `describe('DemoAdminService')`: `serves the service root (F-01 AC-5)`: `GET /odata/v4/demo-admin` returns 200. |
| AC-4, AC-7 | the three files above | Covered by running them: Jest reports 3 passing suites and 0 failed; the files are TypeScript and compiled by `tsc` through the root `tsconfig.json`. |

No test for R1 to R13: none applies (spec, "Rules that apply").

## UI elements (UI work only)

None. F-01 creates no screen and no control; FD-01 to FD-18 do not apply (spec).

## Decisions needed

| # | Decision | Options | Answer |
|---|---|---|---|
| 1 | AC-7, AC-9 and AC-3 cannot all pass with answer 3 as it stands: `app/workspace/tsconfig.json` from the kit template compiles only `./webapp/**/*`, and with no `webapp/` sources `npm run lint:types` fails with TS18003. Adding a `webapp/` folder triggers FE-06 (missing `manifest.json`). | (a) Defer `app/workspace/tsconfig.json` to F-06, keep `ui5.yaml` and `ui5lint.config.mjs` now; AC-9 changes to "has its own UI5-linter configuration; the compiler configuration arrives with F-06" (FILE-11 is only checked once `webapp/` exists). (b) Revisit open question 3 with option (c): a minimal `webapp/` for `app/workspace` with descriptor version 2, `Component.ts` and `i18n/i18n.properties`; more work for ui-developer and FE/UI checks start now. (c) Keep the tsconfig and add a placeholder declaration file outside `webapp/`; a deviation from the template, not recommended. Recommended: (a). | (a) `app/workspace/tsconfig.json` moves to F-06; AC-9 amended. |
| 2 | Two packages outside the list of open question 5 are needed to meet AC-5 and AC-6: `@cap-js/cds-test` 1.0.2 (`cds.test` is no longer part of `@sap/cds`) and `@sap/cds-dk` 10.2.1 (`cds watch`, `cds-tsx`). AC-12 says the new dependencies are "exactly" the listed stack. Also, "cds-typer" is the package `@cap-js/cds-typer`. | (a) Approve both as part of the architecture 1.1 rows "Tests" and "Development tools" and read AC-12 that way; (b) amend AC-12 to name them. | (b) Both approved; AC-12 now names `@cap-js/cds-test`, `@sap/cds-dk` and `@cap-js/cds-typer`. |
| 3 | SRV-02 (Must, `check-cds-model`) rejects a service without `@requires` or `@restrict`, while answer 4 says "no roles". | (a) `@requires: 'authenticated-user'` on all three services (pseudo-role, tests use mocked user `alice`), replaced by the real roles in F-08; (b) `@requires: 'any'`, open to anonymous users until F-08. Recommended: (a). | (a) `@requires: 'authenticated-user'` until F-08. |
| 4 | The `appIdPrefix` change in `tools/lint/standards.config.mjs` is uncommitted in the working tree of `feature/20261125_02_docs-folder-structure`, not on `main`. If it lands on the F-01 branch, AC-3 (`git diff main --stat -- tools/lint` prints nothing) fails. | (a) The user commits it and merges it, with the docs branch, to `main` before the F-01 branch is opened from `main`; (b) it is committed on the F-01 branch and AC-3 is amended to allow exactly this one line. Recommended: (a). | (a) Committed on its own branch and merged to `main` with PRs #1 and #2 before the F-01 branch is opened from `main`. |
| 5 | AC-10 claims Node.js 22.12 or later. The local Node.js is 24.19.0, so evidence on 22.12 needs a 22.12 runtime. `@cap-js/sqlite` 3 has `better-sqlite3` only as an optional peer and may use `node:sqlite`, which needs a flag before Node.js 22.13; if so, `>=22.12` does not hold without `better-sqlite3`. | (a) The user runs `npm test` and `npm run watch` once on Node.js 22.12 and the result goes into `verification.md`; if SQLite fails there, decide between raising the floor to `>=22.13` or adding `better-sqlite3`; (b) accept evidence on Node.js 24 only. | (b) Evidence on Node.js 24 only; `engines` stays `>=22.12`. |

## Verification

Commands that prove the work: `npm ci`, `git config core.hooksPath`, `npm run lint:selftest`, `npm run lint`, `npm test`, `npx jest test`, `npx tsc --noEmit -p .`, `npx cds watch` and `npm run watch` (index page on `http://localhost:4004/`, log line with `sqlite` and `:memory:`), `git diff main --stat -- tools/lint`, `git grep -n -i -E "joule|sap (ai|business|build) .*product"`, `git grep -n -i -E "password|clientsecret|BEGIN PRIVATE KEY"`, `git log main..HEAD --format=%s`.

Expected noise that is not a failure: `ts-jest` may print warning TS151002 about `module: NodeNext` without `isolatedModules`. The root `tsconfig.json` is a kit file; it is not changed in F-01 to silence the warning.

## Tests written

<Filled in by test-author.>
