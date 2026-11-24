# Close Workspace

A partner concept prototype that demonstrates autonomous finance for month-end close: one workspace in which a controller states an outcome, software agents plan and act, and the controller decides on what the policy holds back. Three SAP Fiori apps on one CAP Node.js (TypeScript) service on SAP BTP.

## Non-negotiables

- IMPORTANT: this prototype is never presented as an SAP product. No SAP or Joule names or logos as its own identity, in code, texts, seed data or documentation.
- Synthetic demo data only. No real customer data, no personal data beyond demo user names.
- No credentials in the repository. `.env`, `default-env.json` and `.cdsrc-private.json` are off limits; credentials come from service bindings and destinations.
- SAP Fiori is mandatory: standard SAPUI5 controls, Horizon theme, no custom CSS, no custom controls, no HTML. Fiori elements wherever a floorplan fits.
- Language models never calculate or originate amounts, account numbers, document numbers or dates (rules R4, R13). Policy and impact logic is plain, deterministic TypeScript.

## Sources of truth

| Question | Document |
|---|---|
| What must the demo do, and why | `docs/intent-spec.md` (intents INT-01 to INT-16, rules R1 to R13, Fiori design rules FD-01 to FD-18) |
| How it is built | `docs/architecture-spec.md` (decisions AD-01 to AD-15, Fiori development rules FE-01 to FE-23, data model, services) |
| How code is named and structured | `docs/development-standards.md` (rule IDs CDS, SRV, TS, UI, I18N, FILE, BTP, TEST, GIT) |
| What is being built now | `docs/work/STATUS.md` and `docs/work/<ID>/` |

Precedence when they disagree: development standards over architecture specification on names and file layout; intent specification over architecture specification on behaviour. The architecture specification v0.4 predates the standards. Apply these corrections whenever you take something from it:

- Services sit directly in `srv/` (`workspace-service.cds` plus `workspace-service.ts`), not in `srv/services/`.
- Entities `AgentRegistry`, `ModelUsage`, `Config` are named `Agents`, `ModelUsageStats`, `Settings` (elements `code`, `value`).
- `messageIntent` is `intent`; `quickDecision` is `isQuickDecision`; `anomaly` is `isAnomaly`.
- Every status, mode, role and code element uses an enum type from `db/types.cds`.
- Labels live once in `db/labels.cds`. Manifest descriptor version 2. ESLint 10.

Do not read the specifications end to end. Find the section by ID with Grep, then read that section.

## Repository map

```
app/workspace/     SAPUI5 freestyle, TypeScript (Close Workspace: History, Workspace, Conversation panes)
app/governance/    Fiori elements (Agent Governance)
app/admin/         Fiori elements (Demo Administration)
db/                schema.cds, types.cds, labels.cds, sim-schema.cds, data/, _i18n/
srv/               <name>-service.cds + .ts, conversation/, orchestrator/, agents/<agent>/,
                   policy/, impact/, scheduler/, ports/, adapters/<kind>/, _i18n/
mock-bank/         small REST service for bank statement lines
test/              mirrors srv/, <name>.test.ts
tools/lint/        the lint kit (do not change without the user's approval)
docs/              specifications, standards, deviation logs, work items, and the folders below
```

## Documents and media

All documents, screenshots and video recordings are stored under `docs/`, in one of these folders:

| Folder | Contents |
|---|---|
| `docs/00_inbox/` | Files the user provides as references or detailed instructions. Read them; do not edit them. |
| `docs/10_intent/` | Documents Claude Code writes on the user's instructions to capture intent. |
| `docs/20_design/` | Documents Claude Code writes on the user's instructions to capture design decisions. |
| `docs/30_conventions/` | Documents Claude Code writes on the user's instructions to define coding standards and naming conventions. |
| `docs/40_screenshots/` | Screenshots and video recordings Claude Code captures on the user's instructions, showing interactions with the systems under test. |
| `docs/50_manuals/` | User manuals Claude Code writes on the user's instructions. |

Never put documents, screenshots or recordings anywhere else in the repository. The files that existed before this rule (`docs/*.md` and `docs/work/`) stay where they are until the user decides to move them.

## Commands

```
npm run lint            all nine lint steps (the same check the Stop hook runs)
npm run lint:es:fix     ESLint with fixes
npm run format          Prettier write
npm run lint:<step>     one step: es, format, types, cds, files, fiori, i18n, btp, ui5
npm test                Jest: unit and service tests (in-memory SQLite, scripted model)
npx jest test/policy    one folder or file; prefer this while iterating
npx cds watch           local run with simulated adapters
```

Deployment (`mbt`, `cf`) and `git push` are run by the user, not by Claude.

## How work is done

One work item per session, driven by its specification:

1. `/work-status` shows what is next. Items are intents (`INT-04`) or foundation items (`F-02`).
2. `/specify-intent <ID>` produces `docs/work/<ID>/spec.md` and `plan.md`. The user approves both.
3. `/implement-intent <ID>` builds it: tests first, then code, then independent verification.
4. `/verify-intent <ID>` re-runs the verification alone.

The main session orchestrates and delegates to the subagents in `.claude/agents/`. Subagents do not see this conversation: give each one the work item ID, the paths of `spec.md` and `plan.md`, and the task numbers it owns. They report back in at most 15 lines; details go into files under `docs/work/<ID>/`.

For a change you can describe in one sentence (typo, text, small fix), skip the workflow and do it directly.

## Definition of done

- Every acceptance criterion in `spec.md` has evidence in `verification.md`: a passing test, a command and its output, or a file and line.
- `npm run lint` and `npm test` pass. Show the output; do not assert it.
- `spec-verifier` reports no blocking finding. For changes under `app/`, neither does `fiori-reviewer`.
- `docs/work/STATUS.md` is updated, and the work is committed.

A Stop hook runs the lint kit when you finish and sends you back if it fails. Fix the cause. Never suppress a finding, weaken a rule or edit `tools/lint/` to get past it. If a rule truly cannot be met, stop and ask; an approved deviation is recorded in `docs/deviations.md` or `docs/fiori-deviations.md`.

## Things that are easy to get wrong

- The AI SDK is imported in `srv/adapters/model/` only. Agents talk to the model through `ModelPort`, which is what makes scripted replay possible.
- `srv/policy/` and `srv/impact/` import no CAP, no SDK, no clock, no random numbers, no environment. Time and settings come in as parameters.
- Configuration is read through `cds.env`, logging through `cds.log`. No `process.env`, no `console`.
- Every user-visible text is an i18n key with a text-type comment (`#XBUT: ...`). No text literals in views, controllers or annotations.
- The three-pane frame is `sap.ui.layout.ResponsiveSplitter`. `FlexibleColumnLayout`, `ToolPage` and `SimpleForm` are not used.
- Tests never call a live system or a live model. Every behavioural rule R1 to R13 has a test whose name contains the rule ID.
- When unsure about a CAP, SAPUI5 or Fiori elements API, ask the `cds`, `ui5` or `fiori` MCP server before guessing.

## Git

- Open a new branch for every new feature or work item, named `feature/YYYYMMDD_NN_<summary>`: the date the branch is opened, a two-digit sequence number for that day starting at `01`, and a lower-case kebab-case summary. Example: `feature/20261125_01_policy-permission-intersection` (GIT-02). The pre-commit hook rejects other names; `main` is exempt.
- Commit subject: `type(scope): summary`, at most 72 characters, lower-case imperative. Name the intent or rule IDs in the body. A commit-msg hook checks this.
- Commit when a work item, or a coherent step of it, passes lint and tests. Never commit with `--no-verify`.

## When to stop and ask

- A specification is silent or contradicts itself on something that changes behaviour.
- A requirement would need a deviation from a Must rule.
- A new dependency, a change to the lint kit, or a change to a specification is needed.
- The same failure survives two different fixes.

## Compaction

When compacting, keep: the work item ID, the task numbers finished and open, the list of changed files, and the last lint and test results.
