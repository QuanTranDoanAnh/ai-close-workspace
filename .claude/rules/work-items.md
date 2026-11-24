---
paths:
  - "docs/work/**"
---

# Work item documents

- One folder per work item: `docs/work/<ID>/` with `spec.md`, `plan.md`, `verification.md`, and `fiori-review.md` for UI work. Templates are in `docs/work/_templates/`.
- `spec.md` says what and why, in terms a controller or presenter would recognise. It quotes IDs from the specifications instead of copying their text. It contains no file names and no design.
- Acceptance criteria are numbered `AC-1`, `AC-2`, ... and each one can be checked by a test, a command or a look at one screen. Use the seed-data values, for example 48,200.00 EUR against the limit of 25,000.00 EUR.
- `plan.md` says how: the contract change first, then tasks with an owner agent, the files, and the criteria each task covers.
- `verification.md` holds evidence, not opinion: test names, commands with output, file and line.
- The `status` in the front matter of `spec.md` is `draft` until the user approves it. Only the main session sets `approved`, and only after the user said so.
- `docs/work/STATUS.md` is the single list of work items. Keep its table format; a hook reads it.
