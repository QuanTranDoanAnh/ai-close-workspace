---
name: work-status
description: Shows where the Close Workspace build stands and which work item is next. Use at the start of a session or when asked what to do next.
allowed-tools: Read, Grep, Glob, Bash(git status *), Bash(git log *), Bash(git branch *)
---

Report the state of the build. Do not change any file.

1. Read `docs/work/STATUS.md`.
2. Run `git status --short` and `git log --oneline -5`.
3. For each item that is neither `Not started` nor `Done`, look into `docs/work/<ID>/` and say which documents exist and what `status` the front matter of `spec.md` has.

Answer in this shape, and keep it short:

- **Done**: IDs only.
- **In progress**: per item, the phase it is in and the next step.
- **Next**: the first `Not started` item in build order whose dependencies are all `Done`, with the command to start it (`/specify-intent <ID>`).
- **Blocked**: items waiting for a decision by the user, with the question.
- **Storyline**: which of the scenes 1 to 6 can be shown today, judged from the items that are done. The minimum storyline is scenes 1, 2 and 6.
