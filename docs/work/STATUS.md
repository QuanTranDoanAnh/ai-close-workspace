# Work items

The single list of what is built, in build order. A hook reads this table at session start, so keep the columns and the ID format (`F-01`, `INT-04`).

Status values: `Not started`, `Specified`, `Planned`, `In progress`, `Done`, `Blocked`.

The mapping of intents to work packages (WP) is a proposal derived from the build plan in `docs/architecture-spec.md`, section 14. The `intent-analyst` confirms it for each item when it writes the specification.

## Foundation

| ID | Item | Priority | Status | Depends on | Sources |
|---|---|---|---|---|---|
| F-01 | Project skeleton: CAP Node.js with TypeScript, Jest, three app folders, `npm run lint` and `npm test` green on an empty project | Must | Not started | - | Architecture 1.1, 1.2; standards 2, 13.3; WP1 |
| F-02 | Domain model, enum types, labels and seed data, with the corrected names | Must | Not started | F-01 | Architecture 8; intent 13; standards 4, 14; WP1 |
| F-03 | Ports and simulated adapters, mock bank service | Must | Not started | F-02 | Architecture 5.6, AD decisions on ports; WP1 |
| F-04 | Policy engine, impact calculator, trace writer, proposal lifecycle | Must | Not started | F-03 | Intent 10 (R1 to R3, R5, R6, R9, R10, R13); architecture 5.2, 7; WP2 |
| F-05 | Orchestrator, model port, replay adapter for scripted mode | Must | Not started | F-04 | Architecture 5.2, 5.4; R4, R7, R8; WP3 |
| F-06 | Close Workspace app frame: launchpad app, three panes, polling, shared status formatter | Must | Not started | F-02 | Intent 7, 9; architecture 5.1, 6; WP4 |

## Intents, minimum storyline first (scenes 1, 2 and 6)

| ID | Item | Priority | Status | Depends on | Sources |
|---|---|---|---|---|---|
| INT-01 | State an outcome | Must | Not started | F-05, F-06 | Intent 8 INT-01; scene 1; WP3, WP5 |
| INT-02 | See the plan | Must | Not started | INT-01 | Intent 8 INT-02; scene 1; WP3, WP4 |
| INT-03 | Watch agents work | Must | Not started | INT-02 | Intent 8 INT-03; scene 2; WP3, WP4 |
| INT-04 | Decide on proposals | Must | Not started | INT-03 | Intent 8 INT-04; R1, R3, R5, R6, R11; scene 2; WP2, WP4, WP5 |
| INT-05 | Inspect evidence | Must | Not started | INT-04 | Intent 8 INT-05; scene 2; WP4 |
| INT-08 | Trace everything | Must | Not started | INT-04 | Intent 8 INT-08; scene 6; WP2, WP4 |
| INT-11 | Converse in a thread | Must | Not started | INT-04 | Intent 8 INT-11; R11; WP5 |
| INT-09 | Summarise the close | Must | Not started | INT-08 | Intent 8 INT-09; R13; WP5 |
| INT-16 | Show product status and mapping | Must | Not started | F-06 | Intent 8 INT-16; architecture 13; WP6 |
| INT-10 | Operate the demo | Must | Not started | INT-04 | Intent 8 INT-10; Demo Administration app; WP7 |

## Intents, full storyline (scenes 3, 4 and 5)

| ID | Item | Priority | Status | Depends on | Sources |
|---|---|---|---|---|---|
| INT-14 | See impact and anomalies | Should | Not started | INT-04 | Intent 8 INT-14; R13; scene 2; WP2, WP4 |
| INT-06 | Hand work across functions | Should | Not started | INT-04 | Intent 8 INT-06; R10; scene 3; WP8 |
| INT-07 | Apply a customer-specific closing rule | Should | Not started | INT-10 | Intent 8 INT-07; scene 4; WP8 |
| INT-13 | Sense late events | Should | Not started | INT-11 | Intent 8 INT-13; R12; scene 5; WP9 |
| INT-12 | Navigate history | Should | Not started | F-06 | Intent 8 INT-12; WP4 |
| INT-15 | Inspect agent governance | Should | Not started | INT-08 | Intent 8 INT-15; Agent Governance app; scene 6; WP10 |

## Closing items

| ID | Item | Priority | Status | Depends on | Sources |
|---|---|---|---|---|---|
| F-07 | Fiori compliance gate: walkthrough of every scene, themes, sizes, keyboard, screen reader | Must | Not started | INT-10 | Intent 9.4; architecture 6; WP12 |
| F-08 | Deployment descriptor, security descriptor, launchpad content | Must | Not started | INT-10 | Architecture 10, 11; standards 10 |
| F-09 | Live adapters for the ERP demo tenant | Should | Not started | F-03 | Architecture 5.6; WP11; needs demo tenant access |
