---
paths:
  - "srv/agents/**"
  - "srv/policy/**"
  - "srv/impact/**"
  - "srv/orchestrator/**"
  - "srv/conversation/**"
  - "srv/scheduler/**"
  - "srv/adapters/**"
  - "srv/ports/**"
---

# Agents, policy and guardrails

These files implement the behavioural rules of `docs/intent-spec.md`, section 10. The rules are requirements, and each has a test whose name contains its ID (TEST-03).

| Rule | What the code must guarantee | Where |
|---|---|---|
| R1 | Posting without approval only at or below the auto-post limit. The limit is a setting, never a literal. | `srv/policy/` |
| R2 | A posting that touches a second company code always needs approval. | `srv/policy/` |
| R3 | No agent approves a proposal, its own or another agent's. Approval needs a human user. | `srv/policy/`, service handler |
| R4 | Amounts, account numbers, document numbers and dates come from tools and pass through unchanged. They are never taken from model output. | agents, `zod` schemas |
| R5 | Every proposal carries a plain-language reason naming the rule that held it. | `srv/policy/` |
| R6 | Posting is idempotent. A repeated approval creates no second document. | service handler, adapters |
| R7 | A failed tool call is reported and stops the step. No guessing, no partial data. | agents, orchestrator |
| R8 | No personal data beyond demo user names goes to a model. | `srv/adapters/model/` |
| R9 | An agent acts within the intersection of its own permissions and those of the user who started the run. | `srv/policy/` |
| R10 | Automatic clearing only when exactly one open item matches partner and amount. Otherwise a proposal. | receivables agent, `srv/policy/` |
| R11 | Conversation text never executes a decision. Decisions need an explicit control. | `srv/conversation/` |
| R12 | A scheduled check belongs to one run, runs at most every 5 minutes, ends with the run or after 72 hours. | `srv/scheduler/` |
| R13 | Impact figures, key figures and anomaly flags are computed in code. A model may phrase them, not calculate them. | `srv/impact/` |

## Design rules

- Policy and impact code is pure: same input, same output. No clock, no random numbers, no I/O. Pass `now` and settings in as parameters (SRV-11).
- Agents reach systems only through ports. Each port has a simulated adapter and may have a live one. The mode setting chooses the adapter; agent code does not know which one it has.
- The model is reached only through `ModelPort`. The replay adapter returns recorded answers in scripted mode, so the demo runs without a model.
- Every agent action, tool call, policy decision and user decision writes a trace event. If it is not traced, it did not happen (INT-08).
- Each agent runs under its own technical user (`AGENT_CLOSE_01`, `AGENT_ACCR_01`, `AGENT_ICO_01`, `AGENT_CASH_01`, `AGENT_AR_01`).
- Tests use the simulated adapters and the replay adapter. No test calls a live system or a live model (TEST-04).
