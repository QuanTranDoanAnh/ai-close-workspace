---
name: specify-intent
description: Creates the specification and the plan for one work item (INT-xx or F-xx) and stops for the user's approval. First phase of the spec-driven workflow.
argument-hint: <work item ID, for example INT-04>
disable-model-invocation: true
---

Specify and plan work item **$ARGUMENTS**. You orchestrate; the subagents do the reading. No code is written in this skill.

## 1. Preflight

- Find the row for $ARGUMENTS in `docs/work/STATUS.md`. If it is missing, stop and say so.
- Check that every item in its "Depends on" column is `Done`. If not, tell the user which ones are open and ask whether to continue.

## 2. Specification

- If `docs/work/$ARGUMENTS/spec.md` does not exist, delegate to the `intent-analyst` subagent: "Write the specification for work item $ARGUMENTS."
- Read the resulting `spec.md` yourself. Check that every acceptance criterion is testable and uses concrete values.
- Put each open question to the user with the AskUserQuestion tool, one question per decision, with the options the analyst listed. Write the answers into `spec.md`.
- Show the user the acceptance criteria and the out-of-scope list, and ask for approval.
- When the user approves, set `status: approved` in the front matter of `spec.md` and set the item to `Specified` in `docs/work/STATUS.md`. Never set `approved` on your own.

## 3. Plan

- Delegate to the `solution-planner` subagent: "Write the plan for work item $ARGUMENTS. The specification is approved."
- Read `plan.md`. Check that every acceptance criterion is covered by a task, that each task has one owner, and that the contract change is exact.
- Put each item under "Decisions needed" to the user. Record the answers in `plan.md`.
- Show the user the contract change and the task list, and ask for approval.
- When the user approves, set the item to `Planned` in `docs/work/STATUS.md` and commit both documents: `docs(docs): specify and plan $ARGUMENTS`.

## 4. Hand over

Tell the user to start a fresh session and run `/implement-intent $ARGUMENTS`. A fresh session gives the implementation a clean context with the written specification as its only source.
