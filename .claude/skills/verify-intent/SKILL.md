---
name: verify-intent
description: Runs the independent verification of one work item again - lint, tests, spec-verifier and, for UI changes, fiori-reviewer. Use after manual changes, before a demo, or as the compliance gate.
argument-hint: <work item ID, for example INT-04>
disable-model-invocation: true
---

Verify work item **$ARGUMENTS** without changing code.

1. Check that `docs/work/$ARGUMENTS/spec.md` exists. If not, stop.
2. Run `npm run lint` and `npm test`. Keep the summary lines.
3. Start both reviewers in the same turn:
   - `spec-verifier`: "Verify work item $ARGUMENTS against docs/work/$ARGUMENTS/spec.md. Compare with the base branch."
   - `fiori-reviewer`, if the work item changed anything under `app/`: "Review the UI changes of work item $ARGUMENTS."
4. Read `verification.md` and `fiori-review.md`.
5. Report: the verdict of each reviewer, criteria met out of total, each blocking finding with file, line and owning agent, and the manual walkthrough list.

Do not fix findings in this skill. If the user wants them fixed, they ask, or run `/implement-intent $ARGUMENTS` again, which continues at the fix phase.
