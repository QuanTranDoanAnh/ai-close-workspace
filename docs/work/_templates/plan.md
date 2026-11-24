---
id: <ID>
branch: feature/YYYYMMDD_NN_<summary>
parallel-safe: <yes | no>
---

# Plan for <ID>

## Approach

<Three to five sentences: how the work fits the architecture, and which existing feature it follows as a pattern.>

## Contract change

<Exact change to the CDS model and the service definition: entities, elements with types, enum values, actions with parameters and roles. "None" if there is none.>

## Tasks

| # | Owner | Task | Files | Covers |
|---|---|---|---|---|
| 1 | backend-developer | Contract: ... | | AC-.. |
| 2 | test-author | | | AC-.. |
| 3 | backend-developer | | | AC-.. |
| 4 | ui-developer | | | AC-.. |

## Tests to write first

| Criterion or rule | Test file | What the test asserts |
|---|---|---|

## UI elements (UI work only)

| Element | SAP Fiori guideline article | Standard control |
|---|---|---|

## Decisions needed

| # | Decision | Options | Answer |
|---|---|---|---|

## Verification

Commands that prove the work: `npx jest <path>`, `npm test`, `npm run lint`.

## Tests written

<Filled in by test-author.>
