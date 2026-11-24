---
name: implement-intent
description: Builds one specified and planned work item (INT-xx or F-xx) - tests first, then code, then independent verification. Second phase of the spec-driven workflow.
argument-hint: <work item ID, for example INT-04>
disable-model-invocation: true
---

Implement work item **$ARGUMENTS**. You are the orchestrator: you delegate, check results and keep the documents current. You write code yourself only for one-line corrections.

Every subagent starts with an empty context. Each delegation message must contain: the work item ID, the paths `docs/work/$ARGUMENTS/spec.md` and `plan.md`, the task numbers the agent owns, and what you expect back.

## 1. Preflight

- `docs/work/$ARGUMENTS/spec.md` has `status: approved`, and `plan.md` exists. If not, stop and point to `/specify-intent $ARGUMENTS`.
- `git status` is clean. If not, ask the user what to do with the open changes.
- Create the branch named in the plan, or `feat/<scope>-<short-description>`.
- Set the item to `In progress` in `docs/work/STATUS.md`.
- Create a task list from the tasks in `plan.md`, so progress stays visible.

## 2. Tests first

- Delegate to `test-author`: the tasks it owns. Expect failing tests that fail for the right reason.
- Run the new tests yourself once and confirm they fail.
- For a work item with no testable behaviour (project skeleton, a text change), the plan says so and this phase is skipped.

## 3. Build

- If the plan contains a contract change, delegate that task to `backend-developer` alone first, and wait for it.
- Then delegate the remaining tasks:
  - if the plan marks parallel work as safe, start `backend-developer` and `ui-developer` in the same turn;
  - otherwise run `backend-developer` first, then `ui-developer`.
- Each developer subagent passes a lint gate on its own area when it finishes. If one reports something it could not do, decide: delegate it to the owner of those files, or ask the user.

## 4. Verify

- Run `npm run lint` and `npm test` yourself and keep the summary lines as evidence.
- Start the reviewers in the same turn, so that neither sees the other's result: `spec-verifier` always; `fiori-reviewer` if anything under `app/` changed.
- Read `verification.md` and, for UI work, `fiori-review.md`.

## 5. Fix

- Send each blocking finding to the agent that owns the file, with the finding text, the file and the line. Then run the reviewer that raised it again.
- At most two fix rounds. If a blocking finding survives both, stop and put it to the user with what was tried.
- Notes that are not blocking are listed for the user and not acted on.

## 6. Close

- Set the item to `Done` in `docs/work/STATUS.md` only if both reviewers passed and lint and tests are green. Otherwise leave it `In progress` and say what is open.
- Commit: `feat(<scope>): <summary>` with the work item ID and the rule IDs in the body. Do not push.
- Report to the user, briefly: what was built, the evidence (test and lint summary lines, verdicts of the reviewers), the manual checks the Fiori review lists, and deviations requested, if any.

## Stop and ask the user when

- a subagent reports that the specification or the plan is wrong;
- a Must rule cannot be met without a deviation;
- a new dependency, a change to the lint kit or a change to a specification is needed.
