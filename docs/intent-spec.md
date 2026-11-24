# Intent Specification: Autonomous Finance Close Demo ("Close Workspace")

| Field | Value |
|---|---|
| Document type | Intent specification |
| Version | 0.4 (draft for review) |
| Date | 22 November 2026 |
| Owner | [Owner name] |
| Companion document | Technical Solution Architecture Specification, `autonomous-finance-demo-architecture-spec.md`, version 0.4 |
| Status of facts about SAP products | As researched on 22 November 2026. Re-verify before the customer session. |

## Change log

| Version | Change |
|---|---|
| 0.4 | The demonstration is now three SAP Fiori apps on one launchpad: Close Workspace, Agent Governance and Demo Administration (section 7.1). INT-10, INT-15 and INT-16 and scene 6 adjusted to this. New design rule FD-18, Fiori elements first. Technology constraint added: TypeScript on Node.js and SAPUI5. |
| 0.3 | SAP Fiori made the mandatory design style: new section 9 with design rules FD-01 to FD-17, a status vocabulary, AI content rules and a compliance gate. New goal G10. Pane layout rule changed to the Fiori responsive splitter. Sections 9 to 18 of version 0.2 are now sections 10 to 19. |
| 0.2 | User interface restructured into three panes: History, Workspace and Conversation (new section 7). INT-01 moved into the conversation. New intents INT-11 to INT-16. New rules R9 to R13. New scene 5 for a sensed event, so the governance scene is now scene 6. KPI changed from days to close to touchless rate and blockers. Seed data extended for scenes 4 and 5. Priorities added to every intent. |
| 0.1 | First draft. |

## 1. Intent statement

Build a working concept prototype, called **Close Workspace**, in which a financial controller states a month-end close outcome in a conversation and a team of AI agents plans the work, executes the routine postings, stops for human approval where a rule requires it, hands work across finance functions, reacts to events that arrive later, and leaves a complete audit trail.

The prototype exists to persuade a customer, in a session from December 2026 onward, that the Autonomous Finance operating model is real, controllable and worth a phased investment. It is a partner-built demonstration on SAP BTP. It is not SAP Joule Work and must never be presented as an SAP product.

## 2. Background

- **The vision.** SAP's Autonomous Enterprise strategy, announced in May 2026, describes an organisation that continuously senses what is happening, reasons over it with business context and rules, and acts across end-to-end processes, with people setting priorities and guardrails. Autonomous Finance is the finance domain of that strategy.
- **The standard front end.** SAP Joule Work consists of Conversations (a chat with several threads), Spaces (workspaces assembled around a business outcome), Jobs (automation of routine tasks) and a development environment based on Joule Studio.
- **The gap.** Joule Work is rolling out in phases and runs only in the SAP-managed model. Several finance assistants are still in early adopter programmes. A partner cannot rely on having the standard experience in a demo tenant in December 2026.
- **The response.** Demonstrate the operating model with our own workspace and our own agents on the SAP platform, clearly labelled, in a structure that corresponds part by part to the standard front end, so that the customer can see where the standard product will take over.

## 3. Goals and success criteria

| ID | Goal | Success criterion |
|---|---|---|
| G1 | Show outcome-driven work | The presenter types one sentence in the conversation and a workspace with a plan and blockers appears within 10 seconds. |
| G2 | Prove human-in-the-loop control | At least one posting is executed automatically under the limit and at least one is held for approval over the limit, in the same run. |
| G3 | Show cross-function handoff | One blocker is passed from the closing domain to the receivables domain and resolved there, visibly, without the user coordinating it. |
| G4 | Show customer-specific extensibility | One closing rule that the customer supplies in the discovery call is running as an agent rule in the demo. |
| G5 | Prove auditability | Every agent action and human decision appears in the trace with actor, time and document reference. |
| G6 | Be honest about product status | A status tag and a mapping view are available on screen in every scene, and no screen uses SAP product names or logos as its own. |
| G7 | Be stage-safe | The full storyline runs in under 20 minutes, can be reset in under 10 seconds, and has a fallback that needs no live model call. |
| G8 | Show sensing, not only acting | One event that arrives after the run started is detected and handled without the user asking. |
| G9 | Be recognisable | A person who has seen Joule Work can match each of the three panes to its counterpart without explanation, although no SAP name appears on screen. |
| G10 | Be an SAP Fiori app | Every screen passes the Fiori compliance gate in section 9.4 with no open finding and an empty deviation log. |

**Key figures shown in the workspace**, for the current run only:

- **Touchless rate:** postings and clearings executed without a human decision, divided by all postings and clearings in the run.
- **Open blockers:** count at the start of the run and now.
- **Time to close-ready:** elapsed time from the stated goal until the summary step is ready to run.

The workspace must not show projected customer savings or a "days to close" figure, because neither can be measured in a demo run.

## 4. Non-goals

- Replacing or reproducing SAP Joule Work, Joule Assistants or any SAP standard agent.
- Production readiness: no high availability, no performance engineering, no multi-tenant design.
- Complete close coverage. Only the tasks named in section 8 are automated.
- Open-ended conversation. The thread supports the follow-up intents listed in INT-11 and nothing else.
- AI-generated screen layouts. The workspace layout is fixed and hand-built.
- Tax, consolidation, planning, revenue management and disclosure.
- Use of real customer data. The demo uses synthetic or SAP demo-tenant data only.

## 5. Audience and personas

| Persona | Role in the session | What they need to see |
|---|---|---|
| CFO or finance director (customer) | Decision maker | Control, auditability, a credible path, simple key figures |
| Financial controller (customer) | Future user | That the work is real accounting work and that approval rules match policy |
| Head of IT or enterprise architect (customer) | Technical gatekeeper | Platform fit, security model, what is standard and what is custom |
| Presenter | Runs the demo | A script that cannot go wrong, a reset button, a fallback |
| "M. Controller" | Demo user in the story | Controller for company code 1010 |

## 6. Demo storyline

Title: **Day 3 of month-end close.** One company code (1010), one intercompany partner (1710), one open period. The seed data takes the period as a parameter. The default is 10/2026.

| Scene | Name | What the audience sees | Model activity shown |
|---|---|---|---|
| 1 | Ask for the outcome | The controller types "Close October for company code 1010 and show me what is blocking" in the conversation. A workspace opens in the centre with a five-step plan and blockers. | Reason |
| 2 | Agent executes with approval | The accruals agent posts seven entries under the limit and holds one of 48,200.00 EUR, which is also flagged as unusually high for that supplier. The controller asks "why is this held?" in the conversation, opens the evidence and approves. | Act, with control |
| 3 | Cross-function handoff | An unmatched bank line blocks the close. The cash matching agent hands it to the receivables agent, which finds the one open customer invoice with the same business partner and amount and clears it. | Act, connected |
| 4 | Customer-specific rule | A closing-advisor rule taken from the customer's own policy stops a task from being completed while its predecessor is open. | Reason, extensibility |
| 5 | A late event is sensed | Earlier, the controller asked in the conversation for an hourly re-check of goods receipts. That scheduled check now finds a goods receipt posted after the run started. The accruals agent posts the accrual, a message appears in the conversation, and the key figures update. Nobody asked. | Sense |
| 6 | Governance close-out | The presenter switches to the Agent Governance app. The trace shows every action by agent and every decision by the controller. The agent register shows what each agent may do. | Governance |

After scene 6 the presenter opens the mapping view, shows SAP's own material for the standard assistants, and states which parts are generally available, in early adoption, or on the roadmap.

**Minimum storyline** if time or build runs short: scenes 1, 2 and 6, with scene 6 shown on the trace tab of the workspace, without the Agent Governance app.

## 7. User interface structure

### 7.1 Apps

The demonstration consists of three SAP Fiori apps (section 9) on one SAP Fiori launchpad. Each app starts from its own tile. Names on screen are our own.

| App | User | Purpose | Kind |
|---|---|---|---|
| **Close Workspace** | Controller | Work on a close: state the outcome, follow the agents, decide, converse | Freestyle Fiori app, because no standard floorplan holds three panes |
| **Agent Governance** | IT lead, auditor, controller (read-only) | Agent register, trace across all runs, model usage | SAP Fiori elements, list report and object page |
| **Demo Administration** | Presenter | Configuration, customer rule, status texts for the mapping view, reset, mode, scripted switch, event injection, scene selection | SAP Fiori elements, list report and object page |

- The apps link to each other through launchpad navigation. The History pane of Close Workspace links to Agent Governance. An agent action or trace entry in Agent Governance links back to its run in Close Workspace.
- Splitting governance and administration out of the workspace keeps the controller's screen focused, and lets scene 6 show governance as a tool in its own right.

### 7.2 Panes of Close Workspace

Close Workspace has three panes, realised with the Fiori responsive splitter layout. No pane is labelled with an SAP product term.

| Pane | Position | Content | Corresponds to (said by the presenter, not shown as a label) |
|---|---|---|---|
| **History** | Left, collapsible | List of runs with a filter for "Needs action" and "Completed". List of scheduled checks. Link to the Agent Governance app. | The sidebar list of conversations and Spaces, and Jobs |
| **Workspace** | Centre | The selected run: header with goal, company code, period, mode, scene status tag and key figures. Plan. Decision cards with expandable evidence. Tabs for agent activity and trace. | A Space |
| **Conversation** | Right, collapsible | Thread for the selected run: the user's messages, the assistant's replies, signals from scheduled checks, and quick decisions. Input field at the bottom. | Conversations |

Behaviour:

- Selecting a run in History loads its Workspace and its Conversation together. One run has exactly one thread.
- A new run starts from the input field when no run is selected, or from a "New" action in History.
- The same decision can be taken on the card in the Workspace or on the quick decision in the Conversation. Both show the same state at all times.
- On a narrow screen the Workspace stays visible longest. Panes that no longer fit are reached by the paging of the responsive splitter, first History, then Conversation.
- Every screen carries the notice "Partner concept prototype. Not an SAP product." and, in simulated mode, "Sample data", shown as Fiori message strips.

## 8. Functional intents

Priority: **Must** is needed for the minimum storyline, **Should** for the full storyline, **Could** is optional.

### INT-01 State an outcome (Must)
The user types a goal in the conversation and a run starts.

- Given no run is selected, when the user submits a close-related goal that names a company code and period, then a run starts, appears in History, and its Workspace opens.
- Given the goal omits company code or period, then the assistant uses the values shown in the header and says so in its reply.
- Given the goal is outside demo scope, then the assistant replies that this scenario is not part of the prototype and starts nothing.

### INT-02 See the plan (Must)
The Workspace shows the steps the orchestrator chose and the status of each.

- The plan for the close scenario has exactly five steps: read closing task list, post accruals, reconcile intercompany, match unapplied cash, summarise close status.
- Each step shows one status from: not started, in progress, needs your decision, handed over, done, rejected and returned to agent, ready to run.
- Step 5 becomes "ready to run" only when steps 2 and 3 have no open decision.
- The assistant's first reply in the conversation summarises the plan in one or two sentences and names the blockers.

### INT-03 Watch agents work (Must)
The user sees which agent did what, in near real time.

- Each agent action appears in the activity tab within 3 seconds of completion.
- Each entry names the agent, describes the action in one sentence, and shows a status.
- Counts in the activity tab equal the counts in the underlying data.

### INT-04 Decide on proposals (Must)
The user approves or rejects any proposal that a rule has held back.

- A decision card shows title, amount, proposing agent, the reason the user is being asked, any anomaly flag, and the actions Approve and post, Reject, View evidence.
- Approve posts the journal entry, records the document number, and updates plan, activity, trace, key figures and conversation.
- Reject posts nothing, returns the item to the agent with status "rejected, returned to agent", and records the decision.
- A decision can be reversed. In simulated mode the proposal returns to pending. In live mode the reversal posts a reversing document and both documents appear in the trace.

### INT-05 Inspect evidence (Must)
The user can see what a proposal is based on before deciding.

- The evidence section of a card shows the proposed posting lines with account, debit and credit, and the list of source documents.
- Debits equal credits for every proposal shown.
- Every figure comes from system data. No figure is generated by a language model.

### INT-06 Hand work across functions (Should)
A blocker that belongs to another finance function is passed to that function's agent without user coordination.

- The cash matching agent creates a handoff for each bank line it cannot match.
- The receivables agent picks up the handoff, applies rule R10, and reports back.
- The plan step shows "handed over" while the handoff is open, "done" when it is resolved, and "needs your decision" if rule R10 does not allow automatic clearing.

### INT-07 Apply a customer-specific closing rule (Should)
One rule supplied by the customer runs as part of the closing advisor.

- The rule is configured as data, not code, so that it can be changed between discovery call and demo without a deployment.
- When the rule fires, the activity entry names the rule and the task it affected.
- Default rule until the customer supplies one: "A task may not be marked complete while a predecessor task owned by another team is still open".

### INT-08 Trace everything (Must)
The user and an auditor can reconstruct who did what.

- Every agent action, every human decision and every scheduled check creates one trace event with timestamp, actor, actor type (agent, human or schedule), action, and document reference where one exists.
- Agents act under their own technical users, one per agent. A human user never appears as the actor of an agent action.
- Trace events cannot be edited or deleted from the workspace.

### INT-09 Summarise the close (Must)
At the end of the run the user gets a short close status.

- The summary states tasks open and closed, postings made automatically, postings approved by a human, items still blocking, and the three key figures for this run.
- The summary appears as an assistant message in the conversation and in the Workspace header.
- The text may be written by a language model, but every number in it is injected from system data and checked before display.

### INT-10 Operate the demo (Must)
The presenter controls the session from the Demo Administration app.

- Reset returns all data to the seeded state in under 10 seconds.
- A mode switch selects live mode (S/4HANA Cloud demo tenant) or simulated mode (data held in the prototype's own database). The active mode is always visible.
- A scripted switch replaces live model calls with stored responses for the storyline.
- An "inject event" action creates the late goods receipt for scene 5 on demand.

### INT-11 Converse in a thread (Must for the first two follow-ups, Should for the rest)
The user can continue the conversation about the current run.

- Supported follow-ups: ask what is still blocking, ask why a proposal is held, ask to see the evidence for a proposal, ask to approve or reject a proposal, ask for the summary, ask to schedule a check.
- A reply that concerns a proposal contains a link that scrolls the Workspace to its card.
- A typed request to approve or reject never executes by itself. The assistant answers with a quick decision that the user must press (rule R11).
- Any other request gets the out-of-scope reply from INT-01.
- The thread persists with the run and is shown again when the run is reopened from History.

### INT-12 Navigate history (Should)
The user can find and reopen earlier work.

- History lists runs with goal, company code, period, status and time of last change, newest first.
- The filter "Needs action" shows runs with at least one pending decision or unacknowledged signal. "Completed" shows runs whose summary has been produced.
- A run with a new signal shows a marker until the user opens it.

### INT-13 Sense late events (Should)
A scheduled check finds changes after the run started and the agents respond without being asked.

- The user can schedule a check for a plan step from the conversation or from the step, for example "re-check goods receipts every hour until the close is done".
- When a check finds a new item, the responsible agent processes it under the same rules as in the original step.
- The result appears as a signal message in the conversation, as an activity entry, in the trace, and in the key figures. If a decision is needed, a new card appears.
- Scheduled checks are listed in History with their interval and last result, and can be cancelled there.
- Seeded case for scene 5: a goods receipt of 12,400.00 EUR, under the limit, which the accruals agent posts automatically.

### INT-14 See impact and anomalies (Should)
The user sees what a proposal means before deciding.

- Each decision card shows the effect on the period result and the change in open blockers if approved.
- A proposal is flagged as unusual when its amount is more than twice the three-month average for the same supplier or partner. The flag states both figures.
- Impact figures and anomaly flags are computed in code from system data (rule R13).

### INT-15 Inspect agent governance (Should)
The user and the IT audience can see, in the Agent Governance app, which agents exist, what they may do and what they did.

- The agent list shows each agent with purpose, owner, autonomy rule, technical user, number of actions and model calls used.
- The detail page of an agent shows its tools, its permissions, its trace events and its model usage.
- A trace list across all runs can be filtered by run, agent and actor type, and each entry links to its run in Close Workspace.
- The app is read-only for every role.

### INT-16 Show product status and mapping (Must)
The audience can see at any time what is prototype and what is SAP standard.

- The Workspace header shows a status tag for the current scene. The presenter selects the scene in Demo Administration.
- A mapping view, opened from the Workspace header, lists each part of the prototype with its SAP standard counterpart and that counterpart's availability status. The status text is configuration, so it can be updated in the week of the session.

## 9. SAP Fiori design rules (mandatory)

**SAP Fiori is the required design style for every screen of every app in this demonstration.** The rules in this section are Must. They rank equal to the Must functional intents, they are acceptance criteria for every user interface work item, and no scene is demo-ready while a rule is violated without an approved deviation.

- **Source of truth:** the SAP Fiori Design Guidelines for Web, in the guideline version that matches the SAPUI5 version used for the build. Where this document and the guideline disagree, the guideline wins and this document is corrected.
- **Reason:** the audience must recognise the prototype as something that belongs in their SAP landscape, and the screens must carry over to an implementation without redesign.
- **Limit:** Fiori style governs how the screens look and behave. It does not permit SAP or Joule names, logos or product screens as our own (section 11, Branding).

### 9.1 Design rules

| ID | Rule | How it is checked |
|---|---|---|
| FD-01 | **Guideline first.** Every screen element is designed from the matching Fiori guideline article: page layout, floorplan, UI element or pattern. An SAPUI5 sample alone is not sufficient evidence, because samples are not always Fiori compliant. | Each UI work item names the guideline article it follows |
| FD-02 | **Standard controls only.** Screens are built from standard SAPUI5 controls that the Fiori guidelines describe. No custom controls, no third-party UI libraries, no hand-written HTML. | Code review, library allow-list in the architecture specification |
| FD-03 | **No custom styling.** No custom CSS, no overridden theme styles, no inline styles. Spacing uses the standard margin and padding classes only. | Repository contains no style sheet and no style attributes |
| FD-04 | **Horizon theme.** The app runs in the current SAP Fiori default theme (Horizon, light). It must also be usable in the dark and high-contrast Horizon themes. No hard-coded colours or fonts. | Theme walkthrough of every scene in all four themes |
| FD-05 | **Standard layout for three panes.** History, Workspace and Conversation are panes of the Fiori responsive splitter layout. The flexible column layout is not used for this purpose, because the guideline excludes it for a main area with side panes. Inside each pane, content follows a standard floorplan or list pattern. | Design review against the layout guideline |
| FD-06 | **Launchpad app.** The app starts from a tile in the SAP Fiori launchpad and uses the launchpad shell bar for title, navigation and user menu. It draws no shell of its own. | App opens from the launchpad in the demo space |
| FD-07 | **Semantic states by meaning.** Statuses use the standard semantic states with the fixed mapping in section 9.2. Colour is never the only carrier of meaning: every status has text, and an icon where the guideline provides one. | Status mapping test, greyscale screenshot check |
| FD-08 | **Standard actions.** Button types, order and placement follow the Fiori guideline for actions. Each area has at most one emphasised action. Approve and Reject use the positive and negative semantic button types and the standard wording. | Design review |
| FD-09 | **Standard messages.** Information, warnings, errors and confirmations use the Fiori message patterns: message strip, message box, message toast, message popover. Error texts say what happened and what the user can do. | Review of every message in the storyline |
| FD-10 | **Standard empty and busy states.** An empty pane shows an illustrated message with a next step. Waiting shows the standard busy indication. No pane is ever blank. | Walkthrough with empty data and with slow responses |
| FD-11 | **Fiori AI patterns.** AI-related elements follow section 9.3. | Review against the AI design guidelines |
| FD-12 | **Locale-aware formatting.** Amounts, numbers, dates and times are formatted by the framework for the user's locale. Amounts show the currency and are right-aligned in tables. | Walkthrough in two locales |
| FD-13 | **Guideline-conform text.** Labels, titles, button texts and messages follow the Fiori UI text guidelines, including capitalisation and terminology. All text is translatable. | Text review |
| FD-14 | **Accessibility.** The app meets the accessibility level the Fiori guidelines target: full keyboard operation, visible focus, labels for all inputs, screen-reader announcements for new assistant messages and signals, and sufficient contrast in every theme. | Keyboard-only run of scenes 1, 2 and 6, and one screen-reader pass |
| FD-15 | **Responsive and density-aware.** The app works at Fiori sizes S, M, L and XL and in cozy and compact content density. | Walkthrough at four widths and both densities |
| FD-16 | **SAP icons only.** Icons come from the SAP icon font and are used with the meaning the guideline gives them. | Review |
| FD-18 | **Fiori elements first.** A screen whose structure fits a standard floorplan is built with SAP Fiori elements. Freestyle SAPUI5 is used only where no floorplan fits, and the reason is recorded. Today that applies to Close Workspace only. | Architecture decision names the reason for each freestyle app |
| FD-17 | **Deviations are recorded.** A deviation from any rule needs an entry in the deviation log with the guideline reference, the reason and the owner's approval. The target is zero entries. | Deviation log reviewed at the compliance gate |

### 9.2 Status vocabulary

| Status text | Semantic state | Used for |
|---|---|---|
| Done | Positive | Plan steps, agent actions, resolved handoffs |
| Approved and posted | Positive | Decided proposals |
| Needs your decision | Critical | Plan steps, proposals, runs in History |
| In progress | Information | Plan steps, agent actions |
| Handed over | Information | Plan steps, handoffs |
| Ready to run | Information | Plan step 5 |
| Rejected, returned to agent | Negative | Decided proposals, plan steps |
| Failed | Negative | Agent actions, scheduled checks |
| Not started | Neutral | Plan steps |

### 9.3 AI content rules

- **Mark AI-generated text.** Assistant messages, explanation texts on proposals and the close summary carry the Fiori AI notice with the wording the guideline defines for the AI service in use.
- **Do not mark computed content.** Amounts, posting lines, key figures, impact figures, anomaly flags and statuses are computed in code (rules R4 and R13) and carry no AI notice. The guideline reserves the notice for AI-generated content, and marking everything would hide the distinction that matters to an auditor.
- **Explain holds.** Every held proposal offers the explanation the Fiori explainable-AI guideline calls for: which rule applied and which data it was based on. The evidence section serves this purpose.
- **Use the AI entry point.** The conversation input uses the Fiori AI button and input pattern.
- **Keep the user in control.** Suggested prompts and quick decisions are offers. Nothing AI-initiated executes a posting outside the rules in section 10.

### 9.4 Compliance gate

- **Definition of done.** A user interface work item is done only when it names its guideline articles (FD-01), passes the automated checks in the architecture specification, and has no open finding against FD-01 to FD-16 and FD-18.
- **Review.** A person who did not build the screen walks every scene against this section before the first rehearsal and again before the customer session.
- **Visual reference.** The reference for look and feel is the Fiori guideline and its UI kit. The earlier design-canvas mockup shows structure and content only. Its colours, fonts and components are not Fiori and must not be copied.

## 10. Behavioural rules and guardrails

| ID | Rule |
|---|---|
| R1 | Auto-post limit: an agent may post a journal entry without approval only if its amount is at or below 25,000.00 EUR. The limit is configuration. |
| R2 | Any posting that touches a second company code requires approval, whatever the amount. |
| R3 | An agent never approves its own proposal, and no agent can approve another agent's proposal. |
| R4 | Language models never originate amounts, account numbers, document numbers or dates. These come from tools and are passed through unchanged. |
| R5 | Every proposal carries a plain-language reason that names the rule that held it. |
| R6 | Posting actions are idempotent. Repeating an approval does not create a second document. |
| R7 | If a tool call fails, the agent reports the failure and stops that step. It does not guess or continue with partial data. |
| R8 | No personal data beyond demo user names is sent to a model. |
| R9 | An agent may act only within the intersection of its own permissions and the permissions of the user who started the run or created the scheduled check. |
| R10 | The receivables agent may clear a bank line automatically only when exactly one open item has the same business partner and the same amount. Otherwise it creates a proposal. |
| R11 | Text typed in the conversation never executes a decision. Decisions require an explicit control. |
| R12 | A scheduled check belongs to one run, runs no more often than every 5 minutes, and ends when the run is completed or after 72 hours. Demo Administration actions may trigger a check immediately. |
| R13 | Impact figures, key figures and anomaly flags are computed in code. A language model may phrase them but not calculate them. |

## 11. Constraints

- **Branding.** The product name, logo and screens must not contain "SAP", "Joule" or any SAP offering name as part of their own identity. Pane names and feature names are our own. A "for SAP S/4HANA Cloud" suffix and a factual "not an SAP product" notice are acceptable. Confirm final wording with the SAP partner manager.
- **Design.** SAP Fiori is mandatory for all screens. Section 9 holds the rules. Fiori style is applied through SAP's published guidelines and standard SAPUI5 controls. Joule Work screens are not copied.
- **Honesty.** Simulated data is labelled as sample data on every screen. Scenes carry a status tag (INT-16).
- **Platform.** SAP BTP, using partner test, demo and development entitlements.
- **Technology.** TypeScript throughout: the SAP Cloud Application Programming Model on Node.js for services and agents, SAPUI5 and SAP Fiori elements for the apps. The architecture specification holds the full stack.
- **Time.** A first customer session in December 2026. Scope is cut by priority before the date is moved.
- **Language.** English user interface for the first version. Text is externalised so that a second language can be added.

## 12. Assumptions

1. A BTP subaccount with SAP HANA Cloud, the generative AI hub in SAP AI Core, and Cloud Identity Services is available under partner licensing.
2. An S/4HANA Cloud Public Edition demo tenant is available for live mode. If it is not, the demo runs in simulated mode only.
3. The customer agrees to a 30-minute discovery call before the session, which yields the rule for INT-07 and their approval limit for R1.
4. The audience accepts synthetic data when it is declared as such.

## 13. Demo data intent

The seeded data set must make every scene work on the first run.

| Data object | Content needed | Scene |
|---|---|---|
| Closing task list | 42 tasks for company code 1010, of which 5 are open, with owners, sequence and dependencies | 1 |
| Purchase orders with goods receipt, no invoice | 8 items: 7 at or below the limit, 1 at 48,200.00 EUR | 2 |
| Supplier accrual history | Three-month average of 16,100.00 EUR for the supplier of the 48,200.00 EUR item, so that the anomaly flag fires | 2 |
| Intercompany items | One receivable in 1010 with no matching payable in 1710, difference 3,150.00 EUR | 2 |
| Bank statement lines | One incoming payment that does not match automatically, plus exactly one open customer invoice with the same business partner and amount | 3 |
| Rule violation | Open task "Confirm inventory valuation" whose predecessor "Post goods-in-transit adjustments", owned by another team, is still open | 4 |
| Late event | One goods receipt of 12,400.00 EUR, created by the "inject event" action | 5 |
| History | Two completed runs from earlier periods, so that the History pane is not empty | All |
| Configuration | Auto-post limit, customer rule, agent technical users, status texts for the mapping view | All |

Check value: with this data, both proposals approved and scene 5 played, the run contains 11 postings and clearings, of which 9 were executed without a human decision.

## 14. Phase 2 candidates, not in this build

- Exposing the agents to Joule through the Agent2Agent protocol, so that the standard front end can call them.
- Replacing the closing advisor with the SAP standard Financial Closing Assistant where the tenant has it.
- Additional finance areas: dispute handling, liquidity forecast, tax and e-invoicing checks, planning.
- Data products from SAP Business Data Cloud and the SAP Knowledge Graph as the business context for agents.
- Event-driven sensing through business events in place of scheduled checks.

## 15. Coverage statement

The prototype demonstrates the operating model in one of SAP's six finance capability areas, Accounting and Financial Close, and touches Treasury and Working Capital through cash matching and receivables. Financial Planning and Analysis, Revenue Management, Tax and Trade, and Governance, Risk and Compliance are not demonstrated. The presenter states this on the mapping slide.

## 16. Risks

| Risk | Effect | Mitigation |
|---|---|---|
| The audience takes the prototype for the SAP standard product | Loss of trust later | On-screen notice, status tag, mapping view, explicit statement by the presenter |
| A live model call is slow or fails on stage | Broken storyline | Scripted switch, rehearsed fallback |
| The user types something unsupported in the conversation | Awkward moment, or a wrong answer | Bounded follow-up list (INT-11), clear out-of-scope reply, suggested prompts above the input field |
| The demo tenant lacks an API or a configuration the live mode needs | Live mode unavailable | Simulated mode covers every scene |
| SAP status of Joule Work or the finance assistants changes before the session | Outdated statements | Status texts are configuration. Re-verify in the week of the session. |
| A custom look or custom controls creep in under time pressure | The prototype no longer reads as an SAP Fiori app | Rules FD-02 and FD-03 are checked automatically on every change. Deviations need approval (FD-17). |
| Scope growth before December | Missed date | Build Must intents first. Show Should scenes as recorded walkthroughs if needed. |

## 17. Open questions

1. Which customer and industry is the first session for, and does the default rule in INT-07 fit them?
2. Is live mode required for the first session, or is simulated mode sufficient?
3. Who signs off the product name, pane names and notice wording against SAP partner branding rules?
4. Should the reversal of a decision (INT-04) be shown at all, or does it distract from the main message?
5. Is a Vietnamese user interface needed for the first audience?
6. Should the late event in scene 5 stay under the limit, which shows touchless handling, or exceed it, which shows a second approval?
7. Who performs the Fiori compliance review in section 9.4, and is a UX designer with Fiori experience available for it?

## 18. Glossary

| Term | Meaning in this document |
|---|---|
| Run | One execution of a plan for one stated goal, with one workspace and one conversation thread |
| Plan | The ordered steps the orchestrator selects for a goal |
| Agent | A software component with one accounting task, its own tools and its own technical user |
| Agent Governance | The app that shows the agent register, the trace across runs and model usage |
| Demo Administration | The app the presenter uses to configure, reset and steer the session |
| Proposal | A posting an agent has prepared but may not execute without approval |
| Quick decision | An approve or reject control shown inside the conversation |
| Handoff | A work item passed from one agent to an agent of another finance function |
| Scheduled check | A repeated execution of one plan step for one run |
| Signal | A message that a scheduled check found something new |
| Trace | The append-only record of agent actions, scheduled checks and human decisions |
| Live mode | Agents read from and post to an S/4HANA Cloud demo tenant |
| Simulated mode | Agents read from and post to the prototype's own database |

## 19. References

- SAP News, "SAP Unveils the Autonomous Enterprise", May 2026: https://news.sap.com/2026/05/sap-sapphire-sap-unveils-autonomous-enterprise/
- SAP, Sapphire 2026 Innovation News Guide: https://www.sap.com/topics/events/sapphire/innovation-news-guide-2026
- SAP Learning, "Reviewing the Vision of the Autonomous Enterprise and Autonomous Finance": https://learning.sap.com/courses/exploring-autonomous-finance/understanding-autonomous-finance_e50382e2-1d35-45ac-a88e-8be7af5e9a41
- SAP Learning, "Getting to Know Joule Work": https://learning.sap.com/courses/introducing-joule/getting-to-know-joule-work_c83d6b52-2ca8-4a4d-9a60-f319779f7f64
- SAP Architecture Center, "Joule Work" reference architecture: https://architecture.learning.sap.com/docs/ref-arch/bc7811
- SAP Design System, Joule Work, Spaces: https://www.sap.com/design-system/joule-experiences/joule-work/spaces
- ERP Today, "SAP Rolls Out Joule Work and New Assistants, With Most Arriving by Early 2027": https://erp.today/at-sap-connect-sap-expands-joule-across-every-line-of-business/
- SAP trademark usage guidelines: https://www.sap.com/about/legal/trademark.html
- SAP Fiori Design Guidelines for Web, best practices for designing SAP Fiori apps: https://www.sap.com/design-system/fiori-design-web/v1-142/discover/sap-products/sap-s4hana-only/best-practices-for-designing-sap-fiori-apps
- SAP Fiori Design Guidelines, flexible column layout, including when not to use it: https://www.sap.com/design-system/fiori-design-web/v1-142/page-types/page-layouts/flexible-column-layout/usage
- SAP Fiori Design Guidelines, AI notice base concept: https://www.sap.com/design-system/fiori-design-web/v1-139/foundations/best-practices/global-patterns/ai-notice-base-concept
- SAP Fiori Design Guidelines, explainable AI: https://www.sap.com/design-system/fiori-design-web/v1-139/foundations/ai-and-joule-design/guidelines/explainable-ai-building-explanations
- SAP Learning, "Deconstructing the Golden Rules of SAPUI5 Development": https://learning.sap.com/courses/ui-development-with-sap-fiori/deconstructing-the-golden-rules-of-sapui5-development_a5937529-71dd-4804-9da0-6fcaa4308a91
- SAP Design System, AI patterns and components for partners: https://www.sap.com/design/stories-resources/sap-design-system-is-powering-the-next-generation-of-ai-led-prod
- Close Workspace mockup, earlier single-screen layout, structure only and not a Fiori visual reference (design canvas): https://claude.ai/artifact/7CvL9J34CxuAeMS3vGJHjw
